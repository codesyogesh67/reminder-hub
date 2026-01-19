/*
  Warnings:

  - A unique constraint covering the columns `[userId,name]` on the table `Area` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Area_userId_name_key" ON "public"."Area"("userId", "name");
