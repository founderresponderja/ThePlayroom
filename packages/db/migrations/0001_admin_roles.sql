ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_role varchar(32);

UPDATE users
SET admin_role = 'none'
WHERE admin_role IS NULL;

ALTER TABLE users
ALTER COLUMN admin_role SET DEFAULT 'none';

ALTER TABLE users
ALTER COLUMN admin_role SET NOT NULL;
