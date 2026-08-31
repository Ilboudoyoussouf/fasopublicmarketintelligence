-- CreateEnum
CREATE TYPE "PublicationKind" AS ENUM ('QUOTIDIEN_MARCHES', 'AVIS_GENERAL', 'PPM', 'DOCUMENT_REGLEMENTAIRE', 'DOCUMENT_STATISTIQUE', 'AUTRE');

-- CreateEnum
CREATE TYPE "ExtractionStatus" AS ENUM ('PENDING', 'DOWNLOADED', 'OCR_DONE', 'PARSED', 'CLASSIFIED', 'EXTRACTED', 'VALIDATED', 'FAILED');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('MINISTERE', 'INSTITUTION', 'EPE', 'REGION', 'PROVINCE', 'COMMUNE', 'PROJET', 'AUTRE');

-- CreateEnum
CREATE TYPE "SectorGroup" AS ENUM ('FOURNITURES_SERVICES', 'TRAVAUX', 'PRESTATIONS_INTELLECTUELLES');

-- CreateEnum
CREATE TYPE "ProcedureType" AS ENUM ('APPEL_OFFRES_OUVERT', 'APPEL_OFFRES_OUVERT_ACCELERE', 'DEMANDE_PRIX', 'DEMANDE_COTATION', 'MANIFESTATION_INTERET', 'DEMANDE_PROPOSITIONS', 'DEMANDE_PROPOSITIONS_ALLEGEE', 'AUTRE');

-- CreateEnum
CREATE TYPE "MarketStatus" AS ENUM ('PLANIFIE', 'PUBLIE', 'RECTIFIE', 'ANNULE', 'REPRIS', 'SOUMISSIONS_CLOSES', 'EN_EVALUATION', 'RESULTAT_PUBLIE', 'RESULTAT_RECTIFIE', 'EN_RECOURS', 'EN_REEXAMEN', 'ATTRIBUE', 'CLOTURE');

-- CreateEnum
CREATE TYPE "PublicationType" AS ENUM ('AVIS_APPEL_OFFRES', 'DEMANDE_PRIX', 'DEMANDE_COTATION', 'APPEL_OFFRES_OUVERT', 'APPEL_OFFRES_ACCELERE', 'MANIFESTATION_INTERET', 'DEMANDE_PROPOSITIONS', 'RESULTAT_PROVISOIRE', 'ATTRIBUTION', 'RECTIFICATIF', 'ANNULATION', 'REPRISE', 'REEXAMEN', 'DECISION_RECOURS', 'AVIS_GENERAL_PASSATION', 'PLAN_PASSATION');

-- CreateEnum
CREATE TYPE "FinancingSource" AS ENUM ('EXTERIEUR', 'NATIONAL', 'COMMUNAL', 'AUTRE');

-- CreateEnum
CREATE TYPE "MarketEventType" AS ENUM ('MARKET_CREATED', 'MARKET_UPDATED', 'MARKET_CORRECTED', 'MARKET_CANCELLED', 'MARKET_REPUBLISHED', 'MARKET_EXTENDED', 'BID_SUBMITTED', 'BID_EVALUATED', 'RESULT_PUBLISHED', 'RESULT_CORRECTED', 'APPEAL_FILED', 'APPEAL_DECIDED', 'REVIEW_REQUESTED', 'REVIEW_COMPLETED', 'AWARD_PUBLISHED', 'PPM_CREATED', 'PPM_UPDATED', 'OPPORTUNITY_MATCHED', 'ALERT_CREATED', 'ALERT_SENT');

-- CreateEnum
CREATE TYPE "RequirementType" AS ENUM ('CHIFFRE_AFFAIRES', 'EXPERIENCE_GENERALE', 'EXPERIENCE_SPECIFIQUE', 'REFERENCES', 'AGREMENT', 'CAPACITE_FINANCIERE', 'CAPACITE_TECHNIQUE', 'PERSONNEL', 'DIPLOMES', 'CERTIFICATIONS', 'EQUIPEMENTS', 'MOYENS_MATERIELS', 'DELAI', 'GARANTIES', 'PIECES_ADMINISTRATIVES', 'DOCUMENTS_TECHNIQUES', 'CONDITIONS_GEOGRAPHIQUES', 'CONDITIONS_RESERVATION', 'AUTRE');

-- CreateEnum
CREATE TYPE "RequiredDocType" AS ENUM ('RCCM', 'IFU', 'ATTESTATION_FISCALE', 'ATTESTATION_SOCIALE', 'GARANTIE', 'AGREMENT', 'CERTIFICAT', 'REFERENCE', 'ATTESTATION_BONNE_EXECUTION', 'CV', 'DIPLOME', 'CERTIFICAT_TECHNIQUE', 'PIECE_FINANCIERE', 'PIECE_ADMINISTRATIVE', 'AUTRE');

-- CreateEnum
CREATE TYPE "ReservationCategory" AS ENUM ('PME', 'ENTREPRISES_BURKINABE', 'ENTREPRISES_COMMUNAUTAIRES', 'FEMMES', 'JEUNES', 'CRITERES_SPECIFIQUES', 'CONSULTANTS_BURKINABE_COMMUNAUTAIRES', 'AUTRE');

-- CreateEnum
CREATE TYPE "ParticipationRole" AS ENUM ('BIDDER', 'WINNER', 'LOSER', 'DISQUALIFIED');

-- CreateEnum
CREATE TYPE "RejectionReason" AS ENUM ('PIECE_ADMINISTRATIVE_ABSENTE', 'AGREMENT_ABSENT', 'AGREMENT_NON_CONFORME', 'CARACTERISTIQUE_TECHNIQUE_NON_CONFORME', 'EXPERIENCE_INSUFFISANTE', 'GARANTIE_INCORRECTE', 'DELAI_NON_CONFORME', 'ERREUR_CALCUL', 'ERREUR_QUANTITE', 'OFFRE_ANORMALEMENT_BASSE', 'OFFRE_ANORMALEMENT_ELEVEE', 'DOCUMENT_NON_FOURNI', 'PERSONNEL_NON_CONFORME', 'REFERENCE_INSUFFISANTE', 'AUTRE');

-- CreateEnum
CREATE TYPE "PpmStatus" AS ENUM ('PLANIFIE', 'AVIS_GENERAL_PUBLIE', 'AVIS_MARCHE_PUBLIE', 'EN_SOUMISSION', 'EN_EVALUATION', 'RESULTAT', 'ATTRIBUE');

-- CreateEnum
CREATE TYPE "TenantRole" AS ENUM ('OWNER', 'ADMIN', 'ANALYST', 'COLLABORATOR', 'READONLY');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO', 'BUSINESS', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "WatchlistType" AS ENUM ('MARKET', 'ORGANIZATION', 'COMPANY', 'SECTOR', 'PROJECT', 'REGION', 'KEYWORD');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('NEW_MATCHING_MARKET', 'DEADLINE_APPROACHING', 'CORRECTION', 'CANCELLATION', 'RESULT', 'AWARD', 'APPEAL', 'REVIEW', 'PPM_MATCH', 'DOCUMENT_EXPIRING', 'NEW_TREND');

-- CreateEnum
CREATE TYPE "AlertPriority" AS ENUM ('CRITIQUE', 'IMPORTANTE', 'NORMALE', 'INFORMATION');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('APP', 'EMAIL', 'WHATSAPP', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "MatchVerdict" AS ENUM ('COMPATIBLE', 'PROBABLEMENT_COMPATIBLE', 'A_VERIFIER', 'INCOMPATIBLE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MOBILE_MONEY', 'CARD', 'MANUAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DocumentLifecycleStatus" AS ENUM ('VALID', 'EXPIRING_SOON', 'EXPIRED', 'MISSING', 'UNVERIFIED');

-- CreateEnum
CREATE TYPE "AiRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "ExtractionJobStage" AS ENUM ('DOWNLOAD', 'OCR', 'PARSE', 'CLASSIFY', 'EXTRACT', 'VALIDATE');

-- CreateEnum
CREATE TYPE "ExtractionJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "DataQualityStatus" AS ENUM ('EXTRAIT_AUTOMATIQUEMENT', 'VALIDE', 'CORRIGE', 'INCERTAIN', 'REJETE');

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regulationFramework" TEXT,
    "primarySourceName" TEXT,
    "primarySourceUrl" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Province" (
    "id" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,

    CONSTRAINT "Province_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commune" (
    "id" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Commune_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastCrawledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publication" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "kind" "PublicationKind" NOT NULL,
    "numero" TEXT NOT NULL,
    "isDoubleIssue" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileHash" TEXT,
    "sizeBytes" INTEGER,
    "mimeType" TEXT,
    "isPrincipal" BOOLEAN NOT NULL DEFAULT true,
    "isBis" BOOLEAN NOT NULL DEFAULT false,
    "extractionStatus" "ExtractionStatus" NOT NULL DEFAULT 'PENDING',
    "downloadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentPage" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "rawText" TEXT,
    "ocrConfidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractingAuthority" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "parentId" TEXT,
    "regionName" TEXT,
    "provinceName" TEXT,
    "communeName" TEXT,
    "delegatedManager" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractingAuthority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sector" (
    "id" TEXT NOT NULL,
    "group" "SectorGroup" NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,

    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subsector" (
    "id" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Subsector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Donor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Market" (
    "id" TEXT NOT NULL,
    "reference" TEXT,
    "procedureNumber" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "publicationType" "PublicationType" NOT NULL,
    "procedureType" "ProcedureType" NOT NULL,
    "sectorId" TEXT,
    "subsectorId" TEXT,
    "keywords" TEXT[],
    "status" "MarketStatus" NOT NULL DEFAULT 'PUBLIE',
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "contractingAuthorityId" TEXT NOT NULL,
    "financingSource" "FinancingSource",
    "financingDetail" TEXT,
    "amountEstimatedExclTax" DECIMAL(18,2),
    "amountEstimatedInclTax" DECIMAL(18,2),
    "amountRead" DECIMAL(18,2),
    "amountCorrected" DECIMAL(18,2),
    "amountAfterDiscount" DECIMAL(18,2),
    "amountAwarded" DECIMAL(18,2),
    "amountInitial" DECIMAL(18,2),
    "amountFinal" DECIMAL(18,2),
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "regionId" TEXT,
    "siteDetail" TEXT,
    "publishedAt" TIMESTAMP(3),
    "withdrawalDeadline" TIMESTAMP(3),
    "submissionDeadline" TIMESTAMP(3),
    "submissionTime" TEXT,
    "openingAt" TIMESTAMP(3),
    "bidValidityDays" INTEGER,
    "executionDelayDays" INTEGER,
    "resultAt" TIMESTAMP(3),
    "sourcePublicationId" TEXT,
    "sourceDocumentId" TEXT,
    "sourcePage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketLot" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "objet" TEXT NOT NULL,
    "description" TEXT,
    "montant" DECIMAL(18,2),
    "regionId" TEXT,
    "quantite" DOUBLE PRECISION,
    "unite" TEXT,
    "status" "MarketStatus" NOT NULL DEFAULT 'PUBLIE',
    "attributaireCompanyId" TEXT,

    CONSTRAINT "MarketLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketVersion" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "eventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketEvent" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "type" "MarketEventType" NOT NULL,
    "payload" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "sourceDocumentId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notice" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "pageNumber" INTEGER,
    "publicationType" "PublicationType" NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "rawExcerpt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Correction" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "fieldChanged" TEXT NOT NULL,
    "beforeValue" TEXT,
    "afterValue" TEXT,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "consequence" TEXT,
    "sourceDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Correction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cancellation" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "motif" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3) NOT NULL,
    "procedureConcerned" TEXT,
    "sourceDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cancellation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Republication" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "originalEventId" TEXT,
    "republishedAt" TIMESTAMP(3) NOT NULL,
    "sourceDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Republication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Requirement" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "lotId" TEXT,
    "type" "RequirementType" NOT NULL,
    "rawText" TEXT NOT NULL,
    "thresholdValue" DOUBLE PRECISION,
    "thresholdUnit" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketRequiredDocument" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "lotId" TEXT,
    "docType" "RequiredDocType" NOT NULL,
    "mandatory" BOOLEAN NOT NULL DEFAULT true,
    "rawText" TEXT,

    CONSTRAINT "MarketRequiredDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketReservation" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "lotId" TEXT,
    "category" "ReservationCategory" NOT NULL,
    "rawText" TEXT,

    CONSTRAINT "MarketReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "ifu" TEXT,
    "address" TEXT,
    "regionName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyAlias" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "aliasName" TEXT NOT NULL,
    "sourceDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyMerge" (
    "id" TEXT NOT NULL,
    "sourceCompanyId" TEXT NOT NULL,
    "targetCompanyId" TEXT NOT NULL,
    "reason" TEXT,
    "reversible" BOOLEAN NOT NULL DEFAULT true,
    "performedBy" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyMerge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanySector" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,

    CONSTRAINT "CompanySector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyLicense" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "sourceDocumentId" TEXT,

    CONSTRAINT "CompanyLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyReference" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "marketTitle" TEXT NOT NULL,
    "clientName" TEXT,
    "year" INTEGER,
    "amount" DECIMAL(18,2),

    CONSTRAINT "CompanyReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyParticipation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "role" "ParticipationRole" NOT NULL,
    "amount" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "lotId" TEXT,
    "companyId" TEXT NOT NULL,
    "amountRead" DECIMAL(18,2),
    "amountCorrected" DECIMAL(18,2),
    "conformity" BOOLEAN,
    "rank" INTEGER,
    "rejectionReason" "RejectionReason",
    "rejectionDetail" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BidCorrection" (
    "id" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "beforeValue" TEXT,
    "afterValue" TEXT,
    "reason" TEXT,

    CONSTRAINT "BidCorrection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "criteriaJson" JSONB,
    "note" DOUBLE PRECISION,
    "threshold" DOUBLE PRECISION,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "lotId" TEXT,
    "numberOfBids" INTEGER,
    "meanAmount" DECIMAL(18,2),
    "threshold" DECIMAL(18,2),
    "envelope" DECIMAL(18,2),
    "winnerCompanyId" TEXT,
    "awardedAmount" DECIMAL(18,2),
    "decision" TEXT,
    "resultAt" TIMESTAMP(3) NOT NULL,
    "isCorrected" BOOLEAN NOT NULL DEFAULT false,
    "sourceDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appeal" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "requesterCompanyId" TEXT,
    "object" TEXT NOT NULL,
    "filedAt" TIMESTAMP(3) NOT NULL,
    "authority" TEXT,
    "resultBefore" TEXT,
    "resultAfter" TEXT,
    "sourceDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Appeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppealDecision" (
    "id" TEXT NOT NULL,
    "appealId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL,
    "consequence" TEXT,

    CONSTRAINT "AppealDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "outcome" TEXT,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Funding" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "source" "FinancingSource" NOT NULL,
    "donorId" TEXT,
    "projectId" TEXT,
    "budget" DECIMAL(18,2),

    CONSTRAINT "Funding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PpmPlan" (
    "id" TEXT NOT NULL,
    "contractingAuthorityId" TEXT NOT NULL,
    "exercice" INTEGER NOT NULL,
    "publicationId" TEXT,
    "status" "PpmStatus" NOT NULL DEFAULT 'PLANIFIE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PpmPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PpmItem" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "object" TEXT NOT NULL,
    "sectorId" TEXT,
    "procedureType" "ProcedureType",
    "budget" DECIMAL(18,2),
    "periodPlanned" TEXT,
    "financingSource" "FinancingSource",
    "projectId" TEXT,
    "status" "PpmStatus" NOT NULL DEFAULT 'PLANIFIE',
    "linkedMarketId" TEXT,
    "sourceDocumentId" TEXT,

    CONSTRAINT "PpmItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneralNotice" (
    "id" TEXT NOT NULL,
    "contractingAuthorityId" TEXT NOT NULL,
    "exercice" INTEGER NOT NULL,
    "publicationId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneralNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sectorId" TEXT,
    "regionName" TEXT,
    "size" TEXT,
    "revenueBand" TEXT,
    "experienceYears" INTEGER,
    "preferences" JSONB,
    "targetCategories" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSector" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,

    CONSTRAINT "TenantSector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantLicense" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3),

    CONSTRAINT "TenantLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantReference" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "marketTitle" TEXT NOT NULL,
    "clientName" TEXT,
    "year" INTEGER,
    "amount" DECIMAL(18,2),

    CONSTRAINT "TenantReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantEquipment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "quantity" INTEGER,

    CONSTRAINT "TenantEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantPersonnel" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "count" INTEGER,
    "diplomas" TEXT,

    CONSTRAINT "TenantPersonnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantCertification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "TenantCertification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantZone" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "regionName" TEXT NOT NULL,

    CONSTRAINT "TenantZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "phoneVerifiedAt" TIMESTAMP(3),
    "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantMember" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TenantRole" NOT NULL DEFAULT 'COLLABORATOR',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3),

    CONSTRAINT "TenantMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "WatchlistType" NOT NULL,
    "keyword" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistTarget" (
    "id" TEXT NOT NULL,
    "watchlistId" TEXT NOT NULL,
    "marketId" TEXT,
    "companyId" TEXT,

    CONSTRAINT "WatchlistTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "priority" "AlertPriority" NOT NULL DEFAULT 'NORMALE',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "relatedMarketId" TEXT,
    "dedupeKey" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "sentAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreConfig" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "weights" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "scoreVersion" TEXT NOT NULL,
    "pertinence" DOUBLE PRECISION NOT NULL,
    "eligibilite" DOUBLE PRECISION NOT NULL,
    "attractivite" DOUBLE PRECISION NOT NULL,
    "global" DOUBLE PRECISION NOT NULL,
    "factors" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchResult" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "verdict" "MatchVerdict" NOT NULL,
    "reasons" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "reason" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "plan" "PlanTier" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "currentPeriodEnd" TIMESTAMP(3),
    "gracePeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "externalRef" TEXT,
    "receiptUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "docType" "RequiredDocType" NOT NULL,
    "label" TEXT,
    "fileUrl" TEXT,
    "expirationDate" TIMESTAMP(3),
    "status" "DocumentLifecycleStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "confidence" DOUBLE PRECISION,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionFolder" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OUVERT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissionFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" TIMESTAMP(3),

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FolderDocument" (
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "requiredDocType" "RequiredDocType",
    "tenantDocumentId" TEXT,
    "status" "DocumentLifecycleStatus" NOT NULL DEFAULT 'MISSING',

    CONSTRAINT "FolderDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiConversation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "AiRole" NOT NULL,
    "content" TEXT NOT NULL,
    "confidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSource" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "excerpt" TEXT,

    CONSTRAINT "AiSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractionJob" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "stage" "ExtractionJobStage" NOT NULL,
    "status" "ExtractionJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtractionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataQualityCheck" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "status" "DataQualityStatus" NOT NULL DEFAULT 'EXTRAIT_AUTOMATIQUEMENT',
    "confidence" DOUBLE PRECISION,
    "extractionMethod" TEXT,
    "validatedById" TEXT,
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataQualityCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "dimensionKey" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "value" DECIMAL(18,2) NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Region_countryId_name_key" ON "Region"("countryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Province_regionId_name_key" ON "Province"("regionId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Commune_provinceId_name_key" ON "Commune"("provinceId", "name");

-- CreateIndex
CREATE INDEX "Publication_publishedAt_idx" ON "Publication"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Publication_sourceId_numero_kind_key" ON "Publication"("sourceId", "numero", "kind");

-- CreateIndex
CREATE INDEX "Document_publicationId_idx" ON "Document"("publicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_url_key" ON "Document"("url");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentPage_documentId_pageNumber_key" ON "DocumentPage"("documentId", "pageNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ContractingAuthority_countryId_name_key" ON "ContractingAuthority"("countryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Sector_group_name_key" ON "Sector"("group", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Subsector_sectorId_name_key" ON "Subsector"("sectorId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Donor_name_key" ON "Donor"("name");

-- CreateIndex
CREATE INDEX "Market_status_idx" ON "Market"("status");

-- CreateIndex
CREATE INDEX "Market_publishedAt_idx" ON "Market"("publishedAt");

-- CreateIndex
CREATE INDEX "Market_submissionDeadline_idx" ON "Market"("submissionDeadline");

-- CreateIndex
CREATE INDEX "Market_contractingAuthorityId_idx" ON "Market"("contractingAuthorityId");

-- CreateIndex
CREATE INDEX "Market_sectorId_idx" ON "Market"("sectorId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketLot_marketId_numero_key" ON "MarketLot"("marketId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "MarketVersion_marketId_versionNumber_key" ON "MarketVersion"("marketId", "versionNumber");

-- CreateIndex
CREATE INDEX "MarketEvent_marketId_occurredAt_idx" ON "MarketEvent"("marketId", "occurredAt");

-- CreateIndex
CREATE INDEX "Notice_marketId_idx" ON "Notice"("marketId");

-- CreateIndex
CREATE INDEX "Correction_marketId_idx" ON "Correction"("marketId");

-- CreateIndex
CREATE INDEX "Company_ifu_idx" ON "Company"("ifu");

-- CreateIndex
CREATE UNIQUE INDEX "Company_countryId_canonicalName_key" ON "Company"("countryId", "canonicalName");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyAlias_companyId_aliasName_key" ON "CompanyAlias"("companyId", "aliasName");

-- CreateIndex
CREATE UNIQUE INDEX "CompanySector_companyId_sectorId_key" ON "CompanySector"("companyId", "sectorId");

-- CreateIndex
CREATE INDEX "CompanyLicense_companyId_idx" ON "CompanyLicense"("companyId");

-- CreateIndex
CREATE INDEX "CompanyReference_companyId_idx" ON "CompanyReference"("companyId");

-- CreateIndex
CREATE INDEX "CompanyParticipation_companyId_idx" ON "CompanyParticipation"("companyId");

-- CreateIndex
CREATE INDEX "CompanyParticipation_marketId_idx" ON "CompanyParticipation"("marketId");

-- CreateIndex
CREATE INDEX "Bid_marketId_idx" ON "Bid"("marketId");

-- CreateIndex
CREATE INDEX "Bid_companyId_idx" ON "Bid"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_bidId_key" ON "Evaluation"("bidId");

-- CreateIndex
CREATE INDEX "Result_marketId_idx" ON "Result"("marketId");

-- CreateIndex
CREATE INDEX "Result_winnerCompanyId_idx" ON "Result"("winnerCompanyId");

-- CreateIndex
CREATE INDEX "PpmItem_planId_idx" ON "PpmItem"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_countryId_name_key" ON "Tenant"("countryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSector_tenantId_sectorId_key" ON "TenantSector"("tenantId", "sectorId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TenantMember_tenantId_userId_key" ON "TenantMember"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "Alert_tenantId_createdAt_idx" ON "Alert"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Alert_dedupeKey_idx" ON "Alert"("dedupeKey");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreConfig_version_key" ON "ScoreConfig"("version");

-- CreateIndex
CREATE INDEX "Score_tenantId_global_idx" ON "Score"("tenantId", "global");

-- CreateIndex
CREATE UNIQUE INDEX "Score_tenantId_marketId_scoreVersion_key" ON "Score"("tenantId", "marketId", "scoreVersion");

-- CreateIndex
CREATE UNIQUE INDEX "MatchResult_tenantId_marketId_key" ON "MatchResult"("tenantId", "marketId");

-- CreateIndex
CREATE INDEX "Recommendation_tenantId_rank_idx" ON "Recommendation"("tenantId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_tenantId_key" ON "Subscription"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionFolder_tenantId_marketId_key" ON "SubmissionFolder"("tenantId", "marketId");

-- CreateIndex
CREATE INDEX "ExtractionJob_documentId_idx" ON "ExtractionJob"("documentId");

-- CreateIndex
CREATE INDEX "ExtractionJob_status_idx" ON "ExtractionJob"("status");

-- CreateIndex
CREATE INDEX "DataQualityCheck_entityType_entityId_idx" ON "DataQualityCheck"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "DataQualityCheck_status_idx" ON "DataQualityCheck"("status");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_occurredAt_idx" ON "AuditLog"("occurredAt");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_dimension_period_idx" ON "AnalyticsSnapshot"("dimension", "period");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsSnapshot_dimension_dimensionKey_metric_period_key" ON "AnalyticsSnapshot"("dimension", "dimensionKey", "metric", "period");

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Province" ADD CONSTRAINT "Province_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commune" ADD CONSTRAINT "Commune_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentPage" ADD CONSTRAINT "DocumentPage_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractingAuthority" ADD CONSTRAINT "ContractingAuthority_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractingAuthority" ADD CONSTRAINT "ContractingAuthority_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ContractingAuthority"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subsector" ADD CONSTRAINT "Subsector_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_subsectorId_fkey" FOREIGN KEY ("subsectorId") REFERENCES "Subsector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_contractingAuthorityId_fkey" FOREIGN KEY ("contractingAuthorityId") REFERENCES "ContractingAuthority"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketLot" ADD CONSTRAINT "MarketLot_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketLot" ADD CONSTRAINT "MarketLot_attributaireCompanyId_fkey" FOREIGN KEY ("attributaireCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketVersion" ADD CONSTRAINT "MarketVersion_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketEvent" ADD CONSTRAINT "MarketEvent_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketEvent" ADD CONSTRAINT "MarketEvent_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Correction" ADD CONSTRAINT "Correction_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Correction" ADD CONSTRAINT "Correction_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cancellation" ADD CONSTRAINT "Cancellation_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cancellation" ADD CONSTRAINT "Cancellation_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Republication" ADD CONSTRAINT "Republication_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Republication" ADD CONSTRAINT "Republication_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "MarketLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketRequiredDocument" ADD CONSTRAINT "MarketRequiredDocument_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketRequiredDocument" ADD CONSTRAINT "MarketRequiredDocument_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "MarketLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketReservation" ADD CONSTRAINT "MarketReservation_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketReservation" ADD CONSTRAINT "MarketReservation_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "MarketLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAlias" ADD CONSTRAINT "CompanyAlias_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMerge" ADD CONSTRAINT "CompanyMerge_sourceCompanyId_fkey" FOREIGN KEY ("sourceCompanyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMerge" ADD CONSTRAINT "CompanyMerge_targetCompanyId_fkey" FOREIGN KEY ("targetCompanyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySector" ADD CONSTRAINT "CompanySector_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySector" ADD CONSTRAINT "CompanySector_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyLicense" ADD CONSTRAINT "CompanyLicense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyReference" ADD CONSTRAINT "CompanyReference_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyParticipation" ADD CONSTRAINT "CompanyParticipation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "MarketLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidCorrection" ADD CONSTRAINT "BidCorrection_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "MarketLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_winnerCompanyId_fkey" FOREIGN KEY ("winnerCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_requesterCompanyId_fkey" FOREIGN KEY ("requesterCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppealDecision" ADD CONSTRAINT "AppealDecision_appealId_fkey" FOREIGN KEY ("appealId") REFERENCES "Appeal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funding" ADD CONSTRAINT "Funding_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funding" ADD CONSTRAINT "Funding_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funding" ADD CONSTRAINT "Funding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PpmPlan" ADD CONSTRAINT "PpmPlan_contractingAuthorityId_fkey" FOREIGN KEY ("contractingAuthorityId") REFERENCES "ContractingAuthority"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PpmPlan" ADD CONSTRAINT "PpmPlan_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PpmItem" ADD CONSTRAINT "PpmItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PpmPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PpmItem" ADD CONSTRAINT "PpmItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PpmItem" ADD CONSTRAINT "PpmItem_linkedMarketId_fkey" FOREIGN KEY ("linkedMarketId") REFERENCES "Market"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PpmItem" ADD CONSTRAINT "PpmItem_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralNotice" ADD CONSTRAINT "GeneralNotice_contractingAuthorityId_fkey" FOREIGN KEY ("contractingAuthorityId") REFERENCES "ContractingAuthority"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralNotice" ADD CONSTRAINT "GeneralNotice_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantSector" ADD CONSTRAINT "TenantSector_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantSector" ADD CONSTRAINT "TenantSector_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantLicense" ADD CONSTRAINT "TenantLicense_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantReference" ADD CONSTRAINT "TenantReference_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantEquipment" ADD CONSTRAINT "TenantEquipment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantPersonnel" ADD CONSTRAINT "TenantPersonnel_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantCertification" ADD CONSTRAINT "TenantCertification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantZone" ADD CONSTRAINT "TenantZone_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantMember" ADD CONSTRAINT "TenantMember_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantMember" ADD CONSTRAINT "TenantMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginEvent" ADD CONSTRAINT "LoginEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistTarget" ADD CONSTRAINT "WatchlistTarget_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistTarget" ADD CONSTRAINT "WatchlistTarget_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistTarget" ADD CONSTRAINT "WatchlistTarget_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantDocument" ADD CONSTRAINT "TenantDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionFolder" ADD CONSTRAINT "SubmissionFolder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "SubmissionFolder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FolderDocument" ADD CONSTRAINT "FolderDocument_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "SubmissionFolder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FolderDocument" ADD CONSTRAINT "FolderDocument_tenantDocumentId_fkey" FOREIGN KEY ("tenantDocumentId") REFERENCES "TenantDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMessage" ADD CONSTRAINT "AiMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSource" ADD CONSTRAINT "AiSource_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "AiMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractionJob" ADD CONSTRAINT "ExtractionJob_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataQualityCheck" ADD CONSTRAINT "DataQualityCheck_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
