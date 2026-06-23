-- Add wxOpenid column to better_auth.user table for WeChat Mini Program login
ALTER TABLE "better_auth"."user" ADD COLUMN "wxOpenid" text;
CREATE UNIQUE INDEX "auth_users_wx_openid_unique" ON "better_auth"."user" ("wxOpenid");
