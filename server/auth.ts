import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import type { Express, Request, Response, NextFunction } from 'express';
import { users, insertUserSchema, settings } from '@shared/schema';
import { db } from './db';
import { eq } from 'drizzle-orm';

// Session configuration
export function setupSession(app: Express) {
  const PgSession = connectPg(session);
  
  app.use(session({
    name: 'connect.sid', // Explicitly set session cookie name
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production with HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true, // Prevent XSS attacks
      sameSite: 'lax', // CSRF protection
    },
  }));
}

// Passport configuration
export async function setupPassport(app: Express) {
  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
      done(null, user[0] || undefined);
    } catch (error) {
      done(error, undefined);
    }
  });

  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/api/auth/google/callback`
      : '/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      const existingUser = await db.select().from(users)
        .where(eq(users.providerId, profile.id))
        .limit(1);

      if (existingUser.length > 0) {
        return done(null, existingUser[0]);
      }

      // Create new user
      const newUser = await db.insert(users).values({
        email: profile.emails?.[0]?.value || '',
        name: profile.displayName || '',
        avatar: profile.photos?.[0]?.value || '',
        provider: 'google',
        providerId: profile.id,
      }).returning();

      return done(null, newUser[0]);
    } catch (error) {
      return done(error, undefined);
    }
  }));

  // Check if Facebook login is enabled
  try {
    const facebookSetting = await db.select()
      .from(settings)
      .where(eq(settings.key, 'facebook_login_enabled'))
      .limit(1);

    const isFacebookEnabled = facebookSetting.length > 0 ? Boolean(facebookSetting[0].value) : true;

    if (isFacebookEnabled && process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
      // Facebook OAuth Strategy
      passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID!,
        clientSecret: process.env.FACEBOOK_APP_SECRET!,
        callbackURL: process.env.REPLIT_DOMAINS 
          ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/api/auth/facebook/callback`
          : '/api/auth/facebook/callback',
        profileFields: ['id', 'displayName', 'photos', 'email']
      }, async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          const existingUser = await db.select().from(users)
            .where(eq(users.providerId, profile.id))
            .limit(1);

          if (existingUser.length > 0) {
            return done(null, existingUser[0]);
          }

          // Create new user
          const newUser = await db.insert(users).values({
            email: profile.emails?.[0]?.value || '',
            name: profile.displayName || '',
            avatar: profile.photos?.[0]?.value || '',
            provider: 'facebook',
            providerId: profile.id,
          }).returning();

          return done(null, newUser[0]);
        } catch (error) {
          return done(error, undefined);
        }
      }));
    }
  } catch (error) {
    console.error('Error checking Facebook login setting:', error);
    // Default to disabled if there's an error
  }
}

// Authentication middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
}

// Optional authentication middleware (doesn't block if not authenticated)
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  // Always proceed, but req.user will be undefined if not authenticated
  next();
}

// Auth routes
export async function setupAuthRoutes(app: Express) {
  // Check if Facebook login is enabled for route setup
  let isFacebookEnabled = true;
  try {
    const facebookSetting = await db.select()
      .from(settings)
      .where(eq(settings.key, 'facebook_login_enabled'))
      .limit(1);
    isFacebookEnabled = facebookSetting.length > 0 ? Boolean(facebookSetting[0].value) : true;
  } catch (error) {
    console.error('Error checking Facebook login setting for routes:', error);
    isFacebookEnabled = false;
  }
  // Google OAuth routes
  app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/?error=google_auth_failed' }),
    (req, res) => {
      res.redirect('/');
    }
  );

  // Facebook OAuth routes (only if enabled)
  if (isFacebookEnabled && process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    app.get('/api/auth/facebook',
      passport.authenticate('facebook', { scope: ['email'] })
    );

    app.get('/api/auth/facebook/callback',
      passport.authenticate('facebook', { failureRedirect: '/?error=facebook_auth_failed' }),
      (req, res) => {
        res.redirect('/');
      }
    );
  }

  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      // Destroy the session to fully log out
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          return res.status(500).json({ error: 'Session destruction failed' });
        }
        // Clear the session cookie
        res.clearCookie('connect.sid');
        res.json({ success: true });
      });
    });
  });

  // Get current user
  app.get('/api/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });
}