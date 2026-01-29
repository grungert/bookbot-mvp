# BookBot Development Guidelines

## Prisma Migration Best Practices

### Always Use `prisma migrate dev` in Development

```bash
# CORRECT - Creates migration and applies it
npx prisma migrate dev --name add_feature_name

# AVOID - Causes drift, no migration history
npx prisma db push
```

### Command Reference

| Command | Use Case |
|---------|----------|
| `prisma migrate dev` | Development - creating/applying schema changes |
| `prisma migrate deploy` | Production - applying existing migrations |
| `prisma db push` | **Only** for rapid prototyping when you don't care about migrations |
| `prisma migrate reset` | Only when you explicitly want to wipe the DB |

### If Drift Happens, Resolve Without Reset

If `db push` was accidentally used and created drift, fix it **without losing data**:

```bash
# Step 1: Create migration file WITHOUT applying
npx prisma migrate dev --name fix_drift --create-only

# Step 2: Since DB already has the changes, mark migration as applied
npx prisma migrate resolve --applied "20260129_fix_drift"

# Step 3: Regenerate client
npx prisma generate
```

This tells Prisma: "The database already has these changes, just update your migration history to match."

### Quick Reference

```bash
# Schema changes in development
npx prisma migrate dev --name descriptive_name

# Preview migration SQL without applying
npx prisma migrate dev --name name --create-only

# Apply migrations in production
npx prisma migrate deploy

# Regenerate Prisma Client after schema changes
npx prisma generate

# If drift detected - resolve without reset
npx prisma migrate resolve --applied "migration_name"
```
