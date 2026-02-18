-- CreateTable
CREATE TABLE "ab_results" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "channel" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "winner" TEXT,
    "lift" DOUBLE PRECISION,
    "sampleSizeA" INTEGER NOT NULL,
    "sampleSizeB" INTEGER NOT NULL,
    "rateA" DOUBLE PRECISION NOT NULL,
    "rateB" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ab_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "best_times" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "bestHour" INTEGER NOT NULL,
    "bestDayOfWeek" INTEGER NOT NULL,
    "engagementRate" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "best_times_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cadence_suggestions" (
    "id" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "touchNumber" INTEGER,
    "currentHour" INTEGER,
    "suggestedHour" INTEGER NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cadence_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ab_results_campaignId_idx" ON "ab_results"("campaignId");

-- CreateIndex
CREATE INDEX "ab_results_analyzedAt_idx" ON "ab_results"("analyzedAt");

-- CreateIndex
CREATE INDEX "best_times_channel_segment_idx" ON "best_times"("channel", "segment");

-- CreateIndex
CREATE INDEX "cadence_suggestions_status_idx" ON "cadence_suggestions"("status");
