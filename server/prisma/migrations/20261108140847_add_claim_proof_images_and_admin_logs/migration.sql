-- CreateTable
CREATE TABLE "AdminLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER,
    "adminName" TEXT NOT NULL DEFAULT '',
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL DEFAULT '',
    "targetId" INTEGER,
    "detail" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Claim" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "itemId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "claimantName" TEXT NOT NULL DEFAULT '',
    "claimType" TEXT NOT NULL DEFAULT 'claim',
    "method" TEXT NOT NULL DEFAULT 'offline',
    "proofText" TEXT NOT NULL DEFAULT '',
    "proofImage" TEXT NOT NULL DEFAULT '',
    "proofImages" TEXT NOT NULL DEFAULT '[]',
    "deliveryAddress" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" TEXT NOT NULL DEFAULT '待审核',
    "ownerAudit" TEXT NOT NULL DEFAULT 'pending',
    "adminAudit" TEXT NOT NULL DEFAULT 'pending',
    "handoverStatus" TEXT NOT NULL DEFAULT 'waiting',
    "score" INTEGER NOT NULL DEFAULT 0,
    "auditRemark" TEXT NOT NULL DEFAULT '',
    "wrongReturnReason" TEXT NOT NULL DEFAULT '',
    "handoverMethod" TEXT NOT NULL DEFAULT '',
    "handoverRemark" TEXT NOT NULL DEFAULT '',
    "auditedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Claim_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Claim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Claim" ("adminAudit", "auditRemark", "auditedAt", "claimType", "claimantName", "completedAt", "createdAt", "deliveryAddress", "handoverMethod", "handoverRemark", "handoverStatus", "id", "itemId", "method", "ownerAudit", "phone", "progress", "proofImage", "proofText", "score", "status", "updatedAt", "userId", "wrongReturnReason") SELECT "adminAudit", "auditRemark", "auditedAt", "claimType", "claimantName", "completedAt", "createdAt", "deliveryAddress", "handoverMethod", "handoverRemark", "handoverStatus", "id", "itemId", "method", "ownerAudit", "phone", "progress", "proofImage", "proofText", "score", "status", "updatedAt", "userId", "wrongReturnReason" FROM "Claim";
DROP TABLE "Claim";
ALTER TABLE "new_Claim" RENAME TO "Claim";
CREATE INDEX "Claim_status_idx" ON "Claim"("status");
CREATE INDEX "Claim_userId_idx" ON "Claim"("userId");
CREATE INDEX "Claim_itemId_idx" ON "Claim"("itemId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AdminLog_createdAt_idx" ON "AdminLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminLog_action_idx" ON "AdminLog"("action");
