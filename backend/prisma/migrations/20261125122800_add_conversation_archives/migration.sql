CREATE TABLE "ConversationArchive" (
    "userId" TEXT NOT NULL,
    "peerId" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConversationArchive_pkey" PRIMARY KEY ("userId", "peerId")
);

CREATE INDEX "ConversationArchive_peerId_idx" ON "ConversationArchive"("peerId");

ALTER TABLE "ConversationArchive" ADD CONSTRAINT "ConversationArchive_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationArchive" ADD CONSTRAINT "ConversationArchive_peerId_fkey"
  FOREIGN KEY ("peerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
