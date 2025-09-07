import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import type { Express, Request, Response, NextFunction } from 'express';
import { users, insertUserSchema, settings } from '@shared/schema';
import { db } from './db';
import { eq, and, not } from 'drizzle-orm';

// Session configuration
export function setupSession(app: Express) {
  const PgSession = connectPg(session);
  
  // Configure session for production deployment
  const isProduction = process.env.NODE_ENV === 'production';
  const isReplit = !!process.env.REPLIT_DOMAINS;
  
  app.use(session({
    name: 'connect.sid',
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      tableName: 'session', // Explicit table name
    }),
    secret: process.env.SESSION_SECRET || 'default-development-secret',
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiry on activity
    cookie: {
      secure: isProduction || isReplit, // Always use secure cookies for Replit deployments
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax', // Use 'none' for production OAuth flows
      domain: undefined, // Let the browser set domain automatically
    },
  }));
  
  // Add trust proxy for production
  if (isProduction || isReplit) {
    app.set('trust proxy', 1);
  }
  
  // Add session debugging middleware for production
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Log session issues in production
    if (isProduction && !req.session) {
      console.error('Session not found:', {
        url: req.url,
        headers: req.headers,
        cookies: req.headers.cookie
      });
    }
    
    // Set CORS headers for session cookies
    if (isProduction) {
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    }
    
    next();
  });
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

  // Google OAuth Strategy (only if credentials are available)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/api/auth/google/callback`
      : process.env.NODE_ENV === 'production'
        ? `${process.env.REPL_URL || 'https://localhost'}/api/auth/google/callback`
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
  }

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
          : process.env.NODE_ENV === 'production'
            ? `${process.env.REPL_URL || 'https://localhost'}/api/auth/facebook/callback`
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

  // Check if Twitter login is enabled
  try {
    const twitterSetting = await db.select()
      .from(settings)
      .where(eq(settings.key, 'twitter_login_enabled'))
      .limit(1);

    const isTwitterEnabled = twitterSetting.length > 0 ? Boolean(twitterSetting[0].value) : true;

    if (isTwitterEnabled && process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
      // Twitter OAuth Strategy
      passport.use(new TwitterStrategy({
        consumerKey: process.env.TWITTER_CONSUMER_KEY!,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET!,
        callbackURL: process.env.REPLIT_DOMAINS 
          ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/api/auth/twitter/callback`
          : process.env.NODE_ENV === 'production'
            ? `${process.env.REPL_URL || 'https://localhost'}/api/auth/twitter/callback`
            : '/api/auth/twitter/callback',
        includeEmail: true
      }, async (token, tokenSecret, profile, done) => {
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
            provider: 'twitter',
            providerId: profile.id,
          }).returning();

          return done(null, newUser[0]);
        } catch (error) {
          return done(error, undefined);
        }
      }));
    }
  } catch (error) {
    console.error('Error checking Twitter login setting:', error);
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

  // Check if Twitter login is enabled for route setup
  let isTwitterEnabled = true;
  try {
    const twitterSetting = await db.select()
      .from(settings)
      .where(eq(settings.key, 'twitter_login_enabled'))
      .limit(1);
    isTwitterEnabled = twitterSetting.length > 0 ? Boolean(twitterSetting[0].value) : true;
  } catch (error) {
    console.error('Error checking Twitter login setting for routes:', error);
    isTwitterEnabled = false;
  }
  // Google OAuth routes (only if credentials are available)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get('/api/auth/google',
      passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    app.get('/api/auth/google/callback',
      passport.authenticate('google', { failureRedirect: '/?error=google_auth_failed' }),
      (req, res) => {
        res.redirect('/');
      }
    );
  }

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

  // Twitter OAuth routes (only if enabled)
  if (isTwitterEnabled && process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
    app.get('/api/auth/twitter',
      passport.authenticate('twitter')
    );

    app.get('/api/auth/twitter/callback',
      passport.authenticate('twitter', { failureRedirect: '/?error=twitter_auth_failed' }),
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

  // Update user settings
  app.put('/api/auth/user/settings', requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { name, username } = req.body;

      // Validate name
      if (name && (name.length < 1 || name.length > 50)) {
        return res.status(400).json({ error: 'Name must be between 1 and 50 characters' });
      }

      // Validate username
      if (username !== undefined && username !== null && username !== '') {
        if (username.length < 3 || username.length > 20) {
          return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
        }
      }

      // Check if username already exists (only if username is being set)
      if (username && username.trim() !== '') {
        const existingUser = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.username, username.trim()))
          .limit(1);
        
        if (existingUser.length > 0 && existingUser[0].id !== userId) {
          return res.status(400).json({ error: 'Username already taken' });
        }
      }

      // Prepare update data
      const updateData: any = { updated_at: new Date() };
      if (name !== undefined) updateData.name = name || null;
      if (username !== undefined) {
        updateData.username = username && username.trim() !== '' ? username.trim() : null;
      }

      // Update user
      const updatedUser = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      res.json(updatedUser[0]);
    } catch (error) {
      console.error('Error updating user settings:', error);
      res.status(500).json({ error: 'Failed to update user settings' });
    }
  });
}