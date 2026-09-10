-- CreateTable
CREATE TABLE `Country` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `regulationFramework` VARCHAR(191) NULL,
    `primarySourceName` VARCHAR(191) NULL,
    `primarySourceUrl` VARCHAR(191) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'XOF',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Country_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Region` (
    `id` VARCHAR(191) NOT NULL,
    `countryId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,

    UNIQUE INDEX `Region_countryId_name_key`(`countryId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Province` (
    `id` VARCHAR(191) NOT NULL,
    `regionId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,

    UNIQUE INDEX `Province_regionId_name_key`(`regionId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Commune` (
    `id` VARCHAR(191) NOT NULL,
    `provinceId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Commune_provinceId_name_key`(`provinceId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Source` (
    `id` VARCHAR(191) NOT NULL,
    `countryId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `baseUrl` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastCrawledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Publication` (
    `id` VARCHAR(191) NOT NULL,
    `sourceId` VARCHAR(191) NOT NULL,
    `kind` ENUM('QUOTIDIEN_MARCHES', 'AVIS_GENERAL', 'PPM', 'DOCUMENT_REGLEMENTAIRE', 'DOCUMENT_STATISTIQUE', 'AUTRE') NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `isDoubleIssue` BOOLEAN NOT NULL DEFAULT false,
    `publishedAt` DATETIME(3) NOT NULL,
    `title` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Publication_publishedAt_idx`(`publishedAt`),
    UNIQUE INDEX `Publication_sourceId_numero_kind_key`(`sourceId`, `numero`, `kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Document` (
    `id` VARCHAR(191) NOT NULL,
    `publicationId` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `fileHash` VARCHAR(191) NULL,
    `sizeBytes` INTEGER NULL,
    `mimeType` VARCHAR(191) NULL,
    `isPrincipal` BOOLEAN NOT NULL DEFAULT true,
    `isBis` BOOLEAN NOT NULL DEFAULT false,
    `extractionStatus` ENUM('PENDING', 'DOWNLOADED', 'OCR_DONE', 'PARSED', 'CLASSIFIED', 'EXTRACTED', 'VALIDATED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `downloadedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Document_publicationId_idx`(`publicationId`),
    UNIQUE INDEX `Document_url_key`(`url`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentPage` (
    `id` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `pageNumber` INTEGER NOT NULL,
    `rawText` TEXT NULL,
    `ocrConfidence` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DocumentPage_documentId_pageNumber_key`(`documentId`, `pageNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContractingAuthority` (
    `id` VARCHAR(191) NOT NULL,
    `countryId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('MINISTERE', 'INSTITUTION', 'EPE', 'REGION', 'PROVINCE', 'COMMUNE', 'PROJET', 'AUTRE') NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `regionName` VARCHAR(191) NULL,
    `provinceName` VARCHAR(191) NULL,
    `communeName` VARCHAR(191) NULL,
    `delegatedManager` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ContractingAuthority_countryId_name_key`(`countryId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sector` (
    `id` VARCHAR(191) NOT NULL,
    `group` ENUM('FOURNITURES_SERVICES', 'TRAVAUX', 'PRESTATIONS_INTELLECTUELLES') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,

    UNIQUE INDEX `Sector_group_name_key`(`group`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subsector` (
    `id` VARCHAR(191) NOT NULL,
    `sectorId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Subsector_sectorId_name_key`(`sectorId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Donor` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `regimeProcedural` ENUM('NATIONAL', 'BANQUE_MONDIALE', 'BAD', 'KFW', 'UNION_EUROPEENNE', 'AUTRE') NULL,

    UNIQUE INDEX `Donor_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Market` (
    `id` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NULL,
    `procedureNumber` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `publicationType` ENUM('AVIS_APPEL_OFFRES', 'DEMANDE_PRIX', 'DEMANDE_COTATION', 'APPEL_OFFRES_OUVERT', 'APPEL_OFFRES_ACCELERE', 'MANIFESTATION_INTERET', 'DEMANDE_PROPOSITIONS', 'RESULTAT_PROVISOIRE', 'ATTRIBUTION', 'RECTIFICATIF', 'ANNULATION', 'REPRISE', 'REEXAMEN', 'DECISION_RECOURS', 'AVIS_GENERAL_PASSATION', 'PLAN_PASSATION') NOT NULL,
    `procedureType` ENUM('APPEL_OFFRES_OUVERT', 'APPEL_OFFRES_OUVERT_ACCELERE', 'DEMANDE_PRIX', 'DEMANDE_COTATION', 'MANIFESTATION_INTERET', 'DEMANDE_PROPOSITIONS', 'DEMANDE_PROPOSITIONS_ALLEGEE', 'AUTRE') NOT NULL,
    `sectorId` VARCHAR(191) NULL,
    `subsectorId` VARCHAR(191) NULL,
    `keywords` JSON NOT NULL,
    `status` ENUM('PLANIFIE', 'PUBLIE', 'RECTIFIE', 'ANNULE', 'REPRIS', 'SOUMISSIONS_CLOSES', 'EN_EVALUATION', 'RESULTAT_PUBLIE', 'RESULTAT_RECTIFIE', 'EN_RECOURS', 'EN_REEXAMEN', 'ATTRIBUE', 'CLOTURE') NOT NULL DEFAULT 'PUBLIE',
    `currentVersion` INTEGER NOT NULL DEFAULT 1,
    `contractingAuthorityId` VARCHAR(191) NOT NULL,
    `financingSource` ENUM('EXTERIEUR', 'NATIONAL', 'COMMUNAL', 'AUTRE') NULL,
    `financingDetail` TEXT NULL,
    `amountEstimatedExclTax` DECIMAL(18, 2) NULL,
    `amountEstimatedInclTax` DECIMAL(18, 2) NULL,
    `amountRead` DECIMAL(18, 2) NULL,
    `amountCorrected` DECIMAL(18, 2) NULL,
    `amountAfterDiscount` DECIMAL(18, 2) NULL,
    `amountAwarded` DECIMAL(18, 2) NULL,
    `amountInitial` DECIMAL(18, 2) NULL,
    `amountFinal` DECIMAL(18, 2) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'XOF',
    `regionId` VARCHAR(191) NULL,
    `siteDetail` TEXT NULL,
    `publishedAt` DATETIME(3) NULL,
    `withdrawalDeadline` DATETIME(3) NULL,
    `submissionDeadline` DATETIME(3) NULL,
    `submissionTime` VARCHAR(191) NULL,
    `openingAt` DATETIME(3) NULL,
    `bidValidityDays` INTEGER NULL,
    `executionDelayDays` INTEGER NULL,
    `resultAt` DATETIME(3) NULL,
    `sourcePublicationId` VARCHAR(191) NULL,
    `sourceDocumentId` VARCHAR(191) NULL,
    `sourcePage` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Market_status_idx`(`status`),
    INDEX `Market_publishedAt_idx`(`publishedAt`),
    INDEX `Market_submissionDeadline_idx`(`submissionDeadline`),
    INDEX `Market_contractingAuthorityId_idx`(`contractingAuthorityId`),
    INDEX `Market_sectorId_idx`(`sectorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketLot` (
    `id` VARCHAR(191) NOT NULL,
    `marketId` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `objet` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `montant` DECIMAL(18, 2) NULL,
    `regionId` VARCHAR(191) NULL,
    `quantite` DOUBLE NULL,
    `unite` VARCHAR(191) NULL,
    `status` ENUM('PLANIFIE', 'PUBLIE', 'RECTIFIE', 'ANNULE', 'REPRIS', 'SOUMISSIONS_CLOSES', 'EN_EVALUATION', 'RESULTAT_PUBLIE', 'RESULTAT_RECTIFIE', 'EN_RECOURS', 'EN_REEXAMEN', 'ATTRIBUE', 'CLOTURE') NOT NULL DEFAULT 'PUBLIE',
    `attributaireCompanyId` VARCHAR(191) NULL,
    `criterePges` BOOLEAN NOT NULL DEFAULT false,
    `tauxRabattementPgesPct` DOUBLE NULL,
    `tauxGarantieExecutionPct` DOUBLE NULL,

    UNIQUE INDEX `MarketLot_marketId_numero_key`(`marketId`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketVersion` (
    `id` VARCHAR(191) NOT NULL,
    `marketId` VARCHAR(191) NOT NULL,
    `versionNumber` INTEGER NOT NULL,
    `snapshot` JSON NOT NULL,
    `eventId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `MarketVersion_marketId_versionNumber_key`(`marketId`, `versionNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketEvent` (
    `id` VARCHAR(191) NOT NULL,
    `marketId` VARCHAR(191) NOT NULL,
    `type` ENUM('MARKET_CREATED', 'MARKET_UPDATED', 'MARKET_CORRECTED', 'MARKET_CANCELLED', 'MARKET_REPUBLISHED', 'MARKET_EXTENDED', 'BID_SUBMITTED', 'BID_EVALUATED', 'RESULT_PUBLISHED', 'RESULT_CORRECTED', 'APPEAL_FILED', 'APPEAL_DECIDED', 'REVIEW_REQUESTED', 'REVIEW_COMPLETED', 'AWARD_PUBLISHED', 'PPM_CREATED', 'PPM_UPDATED', 'OPPORTUNITY_MATCHED', 'ALERT_CREATED', 'ALERT_SENT') NOT NULL,
    `payload` JSON NULL,
    `occurredAt` DATETIME(3) NOT NULL,
    `sourceDocumentId` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MarketEvent_marketId_occurredAt_idx`(`marketId`, `occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notice` (
    `id` VARCHAR(191) NOT NULL,
    `marketId` VARCHAR(191) NOT NULL,
    `publicationId` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `pageNumber` INTEGER NULL,
    `publicationType` ENUM('AVIS_APPEL_OFFRES', 'DEMANDE_PRIX', 'DEMANDE_COTATION', 'APPEL_OFFRES_OUVERT', 'APPEL_OFFRES_ACCELERE', 'MANIFESTATION_INTERET', 'DEMANDE_PROPOSITIONS', 'RESULTAT_PROVISOIRE', 'ATTRIBUTION', 'RECTIFICATIF', 'ANNULATION', 'REPRISE', 'REEXAMEN', 'DECISION_RECOURS', 'AVIS_GENERAL_PASSATION', 'PLAN_PASSATION') NOT NULL,
    `publishedAt` DATETIME(3) NOT NULL,
    `rawExcerpt` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notice_marketId_idx`(`marketId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Correction` (
    `id` VARCHAR(191) NOT NULL,
    `marketId` VARCHAR(191) NOT NULL,
    `fieldChanged` VARCHAR(191) NOT NULL,
    `beforeValue` TEXT NULL,
    `afterValue` TEXT NULL,
    `effectiveAt` DATETIME(3) NOT NULL,
    `consequence` TEXT NULL,
    `sourceDocumentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Correction_marketId_idx`(`marketId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cancellation` (
    `id` VARCHAR(191) NOT NULL,
    `marketId` VARCHAR(191) NOT NULL,
    `motif` TEXT NOT NULL,
    `cancelledAt` DATETIME(3) NOT NULL,
    `procedureConcerned` VARCHAR(191) NULL,
    `sourceDocumentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Republication` (
    `id` VARCHAR(191) NOT NULL,
    `marketId` VARCHAR(191) NOT NULL,
    `originalEventId` VARCHAR(191) NULL,
    `republishedAt` DATETIME(3) NOT NULL,
    `sourceDocumentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Requirement` (
    `id` VARCHAR(191) NOT NULL,
    `marketId` VARCHAR(191) NOT NULL,
    `lotId` VARCHAR(191) NULL,
    `type` ENUM('CHIFFRE_AFFAIRES', 'EXPERIENCE_GENERALE', 'EXPERIENCE_SPECIFIQUE', 'REFERENCES', 'AGREMENT', 'CAPACITE_FINANCIERE', 'CAPACITE_TECHNIQUE', 'PERSONNEL', 'DIPLOMES', 'CERTIFICATIONS', 'EQUIPEMENTS', 'MOYENS_MATERIELS', 'DELAI', 'GARANTIES', 'PIECES_ADMINISTRATIVES', 'DOCUMENTS_TECHNIQUES', 'CONDITIONS_GEOGRAPHIQUES', 'CONDITIONS_RESERVATION', 'CERTIFICATION', 'CRITERE_ENVIRONNEMENTAL', 'AUTRE') NOT NULL,
    `rawText` TEXT NOT NULL,
    `thresholdValue` DOUBLE NULL,
    `thresholdUnit` VARCHAR(191) NULL,
    `confidence` DOUBLE NOT NULL DEFAULT 0.7,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketRequiredDocument` (
    `id` VARCHAR(191) NOT NULL,
    `marketId` VARCHAR(191) NOT NULL,
    `lotId` VARCHAR(191) NULL,
    `docType` ENUM('RCCM', 'IFU', 'ATTESTATION_FISCALE', 'ATTESTATION_SOCIALE', 'GARANTIE', 'AGREMENT', 'CERTIFICAT', 'REFERENCE', 'ATTESTATION_BONNE_EXECUTION', 'CV', 'DIPLOME', 'CERTIFICAT_TECHNIQUE', 'PIECE_FINANCIERE', 'PIECE_ADMINISTRATIVE', 'AUTRE') NOT NULL,
    `mandatory` BOOLEAN NOT NULL DEFAULT true,
    `rawText` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketReservation` (
    `id` VARCHAR(191) NOT NULL,
    `marketId` VARCHAR(191) NOT NULL,
    `lotId` VARCHAR(191) NULL,
    `category` ENUM('PME', 'ENTREPRISES_BURKINABE', 'ENTREPRISES_COMMUNAUTAIRES', 'FEMMES', 'JEUNES', 'ACTIONNARIAT_HANDICAP', 'CRITERES_SPECIFIQUES', 'CONSULTANTS_BURKINABE_COMMUNAUTAIRES', 'AUTRE') NOT NULL,
    `rawText` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Company` (
    `id` VARCHAR(191) NOT NULL,
    `countryId` VARCHAR(191) NOT NULL,
    `canonicalName` VARCHAR(191) NOT NULL,
    `ifu` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `regionName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `rccm` VARCHAR(191) NULL,
    `rccmNormalise` VARCHAR(191) NULL,
    `formeJuridique` VARCHAR(191) NULL,
    `telephones` JSON NOT NULL,
    `paysOrigine` VARCHAR(191) NULL,
    `estGroupement` BOOLEAN NOT NULL DEFAULT false,
    `tailleEntreprise` ENUM('MICRO', 'PETITE', 'MOYENNE', 'GRANDE') NULL,
    `regimeFiscal` ENUM('CME_MICRO', 'RSI_SIMPLIFIE', 'RNI_NORMAL') NULL,
    `representantLegal` VARCHAR(191) NULL,
    `anneeCreation` INTEGER NULL,
    `ageGerant` INTEGER NULL,
    `disposePges` BOOLEAN NOT NULL DEFAULT false,
    `dateValiditePges` DATETIME(3) NULL,

    INDEX `Company_ifu_idx`(`ifu`),
    UNIQUE INDEX `Company_countryId_canonicalName_key`(`countryId`, `canonicalName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompanyAlias` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `aliasName` VARCHAR(191) NOT NULL,
    `sourceDocumentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CompanyAlias_companyId_aliasName_key`(`companyId`, `aliasName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompanyMerge` (
    `id` VARCHAR(191) NOT NULL,
    `sourceCompanyId` VARCHAR(191) NOT NULL,
    `targetCompanyId` VARCHAR(191) NOT NULL,
    `reason` TEXT NULL,
    `reversible` BOOLEAN NOT NULL DEFAULT true,
    `performedBy` VARCHAR(191) NULL,
    `performedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompanySector` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `sectorId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `CompanySector_companyId_sectorId_key`(`companyId`, `sectorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompanyLicense` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `categorie` VARCHAR(191) NULL,
    `domaine` VARCHAR(191) NULL,
    `couvertureGeographique` VARCHAR(191) NULL,
    `expirationDate` DATETIME(3) NULL,
    `sourceDocumentId` VARCHAR(191) NULL,

    INDEX `CompanyLicense_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompanyReference` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `marketTitle` VARCHAR(191) NOT NULL,
    `clientName` VARCHAR(191) NULL,
    `year` INTEGER NULL,
    `amount` DECIMAL(18, 2) NULL,

    INDEX `CompanyReference_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompanyParticipation` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `marketId` VARCHAR(191) NOT NULL,
    `role` ENUM('BIDDER', 'WINNER', 'LOSER', 'DISQUALIFIED') NOT NULL,
    `amount` DECIMAL(18, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CompanyParticipation_companyId_idx`(`companyId`),
    INDEX `CompanyParticipation_marketId_idx`(`marketId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RejectionMotif` (
    `code` VARCHAR(191) NOT NULL,
    `category` ENUM('A_FORME_SOUMISSION', 'B_CALCUL_COHERENCE', 'C_ANOMALIES_FINANCIERES', 'D_PIECES_ELIGIBILITE', 'E_CAPACITE_TECHNIQUE', 'F_SPECIFICATIONS_TECHNIQUES', 'G_PRESTATIONS_INTELLECTUELLES', 'H_FRAUDE_FAUSSES_DECLARATIONS', 'I_TAILLE_REGIME_FISCAL') NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `gravite` INTEGER NOT NULL DEFAULT 1,
    `evitable` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Bid` (
    `id` VARCHAR(191) NOT NULL,
    `marketId` VARCHAR(191) NOT NULL,
    `lotId` VARCHAR(191) NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `amountRead` DECIMAL(18, 2) NULL,
    `amountCorrected` DECIMAL(18, 2) NULL,
    `amountAwarded` DECIMAL(18, 2) NULL,
    `awardIncreasePct` DOUBLE NULL,
    `conformity` BOOLEAN NULL,
    `rank` INTEGER NULL,
    `rejectionReason` ENUM('PIECE_ADMINISTRATIVE_ABSENTE', 'AGREMENT_ABSENT', 'AGREMENT_NON_CONFORME', 'CARACTERISTIQUE_TECHNIQUE_NON_CONFORME', 'EXPERIENCE_INSUFFISANTE', 'GARANTIE_INCORRECTE', 'DELAI_NON_CONFORME', 'ERREUR_CALCUL', 'ERREUR_QUANTITE', 'OFFRE_ANORMALEMENT_BASSE', 'OFFRE_ANORMALEMENT_ELEVEE', 'DOCUMENT_NON_FOURNI', 'PERSONNEL_NON_CONFORME', 'REFERENCE_INSUFFISANTE', 'AUTRE') NULL,
    `rejectionMotifCodes` JSON NOT NULL,
    `rejectionDetail` TEXT NULL,
    `submittedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Bid_marketId_idx`(`marketId`),
    INDEX `Bid_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BidCorrection` (
    `id` VARCHAR(191) NOT NULL,
    `bidId` VARCHAR(191) NOT NULL,
    `field` VARCHAR(191) NOT NULL,
    `beforeValue` TEXT NULL,
    `afterValue` TEXT NULL,
    `reason` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Evaluation` (
    `id` VARCHAR(191) NOT NULL,
    `bidId` VARCHAR(191) NOT NULL,
    `criteriaJson` JSON NULL,
    `note` DOUBLE NULL,
    `threshold` DOUBLE NULL,

    UNIQUE INDEX `Evaluation_bidId_key`(`bidId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Result` (
    `id` VARCHAR(191) NOT NULL,
    `marketId` VARCHAR(191) NOT NULL,
    `lotId` VARCHAR(191) NULL,
    `numberOfBids` INTEGER NULL,
    `meanAmount` DECIMAL(18, 2) NULL,
    `threshold` DECIMAL(18, 2) NULL,
    `envelope` DECIMAL(18, 2) NULL,
    `winnerCompanyId` VARCHAR(191) NULL,
    `awardedAmount` DECIMAL(18, 2) NULL,
    `decision` TEXT NULL,
    `resultAt` DATETIME(3) NOT NULL,
    `isCorrected` BOOLEAN NOT NULL DEFAULT false,
    `sourceDocumentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `seuil085M` DECIMAL(18, 2) NULL,
    `seuil115M` DECIMAL(18, 2) NULL,
    `seuilTolerance5pct` DECIMAL(18, 2) NULL,
    `oabConvention` ENUM('CANONIQUE', 'NOMENCLATURE_INVERSEE', 'SOMME_ERRONEE', 'TABLEAU_NOMME', 'TOLERANCE_ALTERNATIVE', 'DOUBLE_CALCUL', 'INDETERMINEE') NULL,
    `scoreCoherence` DOUBLE NULL,

    INDEX `Result_marketId_idx`(`marketId`),
    INDEX `Result_winnerCompanyId_idx`(`winnerCompanyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Appeal` (
    `id` VARCHAR(191) NOT NULL,
    `marketId` VARCHAR(191) NOT NULL,
    `requesterCompanyId` VARCHAR(191) NULL,
    `object` VARCHAR(191) NOT NULL,
    `filedAt` DATETIME(3) NOT NULL,
    `authority` VARCHAR(191) NULL,
    `resultBefore` TEXT NULL,
    `resultAfter` TEXT NULL,
    `appealType` ENUM('RECOURS_PREALABLE', 'RECOURS_ARCOP') NULL,
    `referenceDecision` VARCHAR(191) NULL,
    `organeDecision` ENUM('ORD', 'CRD') NULL,
    `sourceDocumentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AppealDecision` (
    `id` VARCHAR(191) NOT NULL,
    `appealId` VARCHAR(191) NOT NULL,
    `decision` TEXT NOT NULL,
    `decidedAt` DATETIME(3) NOT NULL,
    `consequence` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Review` (
    `id` VARCHAR(191) NOT NULL,
    `marketId` VARCHAR(191) NOT NULL,
    `requestedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `outcome` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Funding` (
    `id` VARCHAR(191) NOT NULL,
    `marketId` VARCHAR(191) NOT NULL,
    `source` ENUM('EXTERIEUR', 'NATIONAL', 'COMMUNAL', 'AUTRE') NOT NULL,
    `donorId` VARCHAR(191) NULL,
    `projectId` VARCHAR(191) NULL,
    `budget` DECIMAL(18, 2) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PpmPlan` (
    `id` VARCHAR(191) NOT NULL,
    `contractingAuthorityId` VARCHAR(191) NOT NULL,
    `exercice` INTEGER NOT NULL,
    `publicationId` VARCHAR(191) NULL,
    `status` ENUM('PLANIFIE', 'AVIS_GENERAL_PUBLIE', 'AVIS_MARCHE_PUBLIE', 'EN_SOUMISSION', 'EN_EVALUATION', 'RESULTAT', 'ATTRIBUE') NOT NULL DEFAULT 'PLANIFIE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PpmItem` (
    `id` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `object` VARCHAR(191) NOT NULL,
    `sectorId` VARCHAR(191) NULL,
    `procedureType` ENUM('APPEL_OFFRES_OUVERT', 'APPEL_OFFRES_OUVERT_ACCELERE', 'DEMANDE_PRIX', 'DEMANDE_COTATION', 'MANIFESTATION_INTERET', 'DEMANDE_PROPOSITIONS', 'DEMANDE_PROPOSITIONS_ALLEGEE', 'AUTRE') NULL,
    `budget` DECIMAL(18, 2) NULL,
    `periodPlanned` VARCHAR(191) NULL,
    `financingSource` ENUM('EXTERIEUR', 'NATIONAL', 'COMMUNAL', 'AUTRE') NULL,
    `projectId` VARCHAR(191) NULL,
    `status` ENUM('PLANIFIE', 'AVIS_GENERAL_PUBLIE', 'AVIS_MARCHE_PUBLIE', 'EN_SOUMISSION', 'EN_EVALUATION', 'RESULTAT', 'ATTRIBUE') NOT NULL DEFAULT 'PLANIFIE',
    `linkedMarketId` VARCHAR(191) NULL,
    `sourceDocumentId` VARCHAR(191) NULL,

    INDEX `PpmItem_planId_idx`(`planId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GeneralNotice` (
    `id` VARCHAR(191) NOT NULL,
    `contractingAuthorityId` VARCHAR(191) NOT NULL,
    `exercice` INTEGER NOT NULL,
    `publicationId` VARCHAR(191) NOT NULL,
    `publishedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupplierDirectory` (
    `id` VARCHAR(191) NOT NULL,
    `contractingAuthorityId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `domaine` VARCHAR(191) NULL,
    `exercices` JSON NOT NULL,
    `status` ENUM('PUBLIE', 'RECTIFIE') NOT NULL DEFAULT 'PUBLIE',
    `publicationId` VARCHAR(191) NULL,
    `sourceDocumentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupplierDirectoryEntry` (
    `id` VARCHAR(191) NOT NULL,
    `directoryId` VARCHAR(191) NOT NULL,
    `pliNumber` VARCHAR(191) NULL,
    `companyId` VARCHAR(191) NULL,
    `rawName` VARCHAR(191) NOT NULL,
    `ifu` VARCHAR(191) NULL,
    `rccm` VARCHAR(191) NULL,
    `representantLegal` VARCHAR(191) NULL,
    `telephone` VARCHAR(191) NULL,
    `ville` VARCHAR(191) NULL,
    `anneeCreation` INTEGER NULL,
    `agrement` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SupplierDirectoryEntry_directoryId_idx`(`directoryId`),
    INDEX `SupplierDirectoryEntry_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tenant` (
    `id` VARCHAR(191) NOT NULL,
    `countryId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `sectorId` VARCHAR(191) NULL,
    `regionName` VARCHAR(191) NULL,
    `size` VARCHAR(191) NULL,
    `revenueBand` VARCHAR(191) NULL,
    `experienceYears` INTEGER NULL,
    `preferences` JSON NULL,
    `targetCategories` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Tenant_countryId_name_key`(`countryId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TenantSector` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `sectorId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `TenantSector_tenantId_sectorId_key`(`tenantId`, `sectorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TenantLicense` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `expirationDate` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TenantReference` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `marketTitle` VARCHAR(191) NOT NULL,
    `clientName` VARCHAR(191) NULL,
    `year` INTEGER NULL,
    `amount` DECIMAL(18, 2) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TenantEquipment` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TenantPersonnel` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `count` INTEGER NULL,
    `diplomas` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TenantCertification` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TenantZone` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `regionName` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `emailVerifiedAt` DATETIME(3) NULL,
    `phoneVerifiedAt` DATETIME(3) NULL,
    `isPlatformAdmin` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TenantMember` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'ADMIN', 'ANALYST', 'COLLABORATOR', 'READONLY') NOT NULL DEFAULT 'COLLABORATOR',
    `invitedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `joinedAt` DATETIME(3) NULL,

    UNIQUE INDEX `TenantMember_tenantId_userId_key`(`tenantId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoginEvent` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `success` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Watchlist` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `type` ENUM('MARKET', 'ORGANIZATION', 'COMPANY', 'SECTOR', 'PROJECT', 'REGION', 'KEYWORD') NOT NULL,
    `keyword` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WatchlistTarget` (
    `id` VARCHAR(191) NOT NULL,
    `watchlistId` VARCHAR(191) NOT NULL,
    `marketId` VARCHAR(191) NULL,
    `companyId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Alert` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `type` ENUM('NEW_MATCHING_MARKET', 'DEADLINE_APPROACHING', 'CORRECTION', 'CANCELLATION', 'RESULT', 'AWARD', 'APPEAL', 'REVIEW', 'PPM_MATCH', 'DOCUMENT_EXPIRING', 'NEW_TREND') NOT NULL,
    `priority` ENUM('CRITIQUE', 'IMPORTANTE', 'NORMALE', 'INFORMATION') NOT NULL DEFAULT 'NORMALE',
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NULL,
    `relatedMarketId` VARCHAR(191) NULL,
    `dedupeKey` VARCHAR(191) NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Alert_tenantId_createdAt_idx`(`tenantId`, `createdAt`),
    INDEX `Alert_dedupeKey_idx`(`dedupeKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `alertId` VARCHAR(191) NOT NULL,
    `channel` ENUM('APP', 'EMAIL', 'WHATSAPP', 'PUSH') NOT NULL,
    `status` ENUM('QUEUED', 'SENT', 'FAILED') NOT NULL DEFAULT 'QUEUED',
    `sentAt` DATETIME(3) NULL,
    `error` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScoreConfig` (
    `id` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `weights` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `effectiveFrom` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ScoreConfig_version_key`(`version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Score` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `marketId` VARCHAR(191) NOT NULL,
    `scoreVersion` VARCHAR(191) NOT NULL,
    `pertinence` DOUBLE NOT NULL,
    `eligibilite` DOUBLE NOT NULL,
    `attractivite` DOUBLE NOT NULL,
    `global` DOUBLE NOT NULL,
    `factors` JSON NOT NULL,
    `computedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Score_tenantId_global_idx`(`tenantId`, `global`),
    UNIQUE INDEX `Score_tenantId_marketId_scoreVersion_key`(`tenantId`, `marketId`, `scoreVersion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MatchResult` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `marketId` VARCHAR(191) NOT NULL,
    `verdict` ENUM('COMPATIBLE', 'PROBABLEMENT_COMPATIBLE', 'A_VERIFIER', 'INCOMPATIBLE') NOT NULL,
    `reasons` JSON NOT NULL,
    `computedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `MatchResult_tenantId_marketId_key`(`tenantId`, `marketId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Recommendation` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `marketId` VARCHAR(191) NOT NULL,
    `rank` INTEGER NOT NULL,
    `reason` JSON NOT NULL,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Recommendation_tenantId_rank_idx`(`tenantId`, `rank`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subscription` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `plan` ENUM('FREE', 'PRO', 'BUSINESS', 'ENTERPRISE') NOT NULL DEFAULT 'FREE',
    `status` ENUM('TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED') NOT NULL DEFAULT 'TRIAL',
    `currentPeriodEnd` DATETIME(3) NULL,
    `gracePeriodEnd` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Subscription_tenantId_key`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `subscriptionId` VARCHAR(191) NOT NULL,
    `provider` ENUM('MOBILE_MONEY', 'CARD', 'MANUAL') NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'XOF',
    `status` ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `externalRef` VARCHAR(191) NULL,
    `receiptUrl` VARCHAR(191) NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TenantDocument` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `docType` ENUM('RCCM', 'IFU', 'ATTESTATION_FISCALE', 'ATTESTATION_SOCIALE', 'GARANTIE', 'AGREMENT', 'CERTIFICAT', 'REFERENCE', 'ATTESTATION_BONNE_EXECUTION', 'CV', 'DIPLOME', 'CERTIFICAT_TECHNIQUE', 'PIECE_FINANCIERE', 'PIECE_ADMINISTRATIVE', 'AUTRE') NOT NULL,
    `label` VARCHAR(191) NULL,
    `fileUrl` VARCHAR(191) NULL,
    `expirationDate` DATETIME(3) NULL,
    `status` ENUM('VALID', 'EXPIRING_SOON', 'EXPIRED', 'MISSING', 'UNVERIFIED') NOT NULL DEFAULT 'UNVERIFIED',
    `confidence` DOUBLE NULL,
    `lastVerifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubmissionFolder` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `marketId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'OUVERT',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SubmissionFolder_tenantId_marketId_key`(`tenantId`, `marketId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChecklistItem` (
    `id` VARCHAR(191) NOT NULL,
    `folderId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `done` BOOLEAN NOT NULL DEFAULT false,
    `dueDate` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FolderDocument` (
    `id` VARCHAR(191) NOT NULL,
    `folderId` VARCHAR(191) NOT NULL,
    `requiredDocType` ENUM('RCCM', 'IFU', 'ATTESTATION_FISCALE', 'ATTESTATION_SOCIALE', 'GARANTIE', 'AGREMENT', 'CERTIFICAT', 'REFERENCE', 'ATTESTATION_BONNE_EXECUTION', 'CV', 'DIPLOME', 'CERTIFICAT_TECHNIQUE', 'PIECE_FINANCIERE', 'PIECE_ADMINISTRATIVE', 'AUTRE') NULL,
    `tenantDocumentId` VARCHAR(191) NULL,
    `status` ENUM('VALID', 'EXPIRING_SOON', 'EXPIRED', 'MISSING', 'UNVERIFIED') NOT NULL DEFAULT 'MISSING',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiConversation` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiMessage` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `role` ENUM('USER', 'ASSISTANT') NOT NULL,
    `content` TEXT NOT NULL,
    `confidence` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiSource` (
    `id` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `excerpt` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExtractionJob` (
    `id` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `stage` ENUM('DOWNLOAD', 'OCR', 'PARSE', 'CLASSIFY', 'EXTRACT', 'VALIDATE') NOT NULL,
    `status` ENUM('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'NEEDS_REVIEW') NOT NULL DEFAULT 'PENDING',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `errorMessage` VARCHAR(191) NULL,
    `startedAt` DATETIME(3) NULL,
    `finishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ExtractionJob_documentId_idx`(`documentId`),
    INDEX `ExtractionJob_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DataQualityCheck` (
    `id` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `field` VARCHAR(191) NOT NULL,
    `status` ENUM('EXTRAIT_AUTOMATIQUEMENT', 'VALIDE', 'CORRIGE', 'INCERTAIN', 'REJETE') NOT NULL DEFAULT 'EXTRAIT_AUTOMATIQUEMENT',
    `confidence` DOUBLE NULL,
    `extractionMethod` VARCHAR(191) NULL,
    `validatedById` VARCHAR(191) NULL,
    `validatedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DataQualityCheck_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `DataQualityCheck_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NULL,
    `actorUserId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `before` JSON NULL,
    `after` JSON NULL,
    `occurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `AuditLog_occurredAt_idx`(`occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BlockHash` (
    `hash` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BlockHash_documentId_idx`(`documentId`),
    PRIMARY KEY (`hash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnalyticsSnapshot` (
    `id` VARCHAR(191) NOT NULL,
    `dimension` VARCHAR(191) NOT NULL,
    `dimensionKey` VARCHAR(191) NOT NULL,
    `metric` VARCHAR(191) NOT NULL,
    `period` VARCHAR(191) NOT NULL,
    `value` DECIMAL(18, 2) NOT NULL,
    `computedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AnalyticsSnapshot_dimension_period_idx`(`dimension`, `period`),
    UNIQUE INDEX `AnalyticsSnapshot_dimension_dimensionKey_metric_period_key`(`dimension`, `dimensionKey`, `metric`, `period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Region` ADD CONSTRAINT `Region_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Province` ADD CONSTRAINT `Province_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `Region`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Commune` ADD CONSTRAINT `Commune_provinceId_fkey` FOREIGN KEY (`provinceId`) REFERENCES `Province`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Source` ADD CONSTRAINT `Source_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Publication` ADD CONSTRAINT `Publication_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `Source`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Document` ADD CONSTRAINT `Document_publicationId_fkey` FOREIGN KEY (`publicationId`) REFERENCES `Publication`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentPage` ADD CONSTRAINT `DocumentPage_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `Document`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContractingAuthority` ADD CONSTRAINT `ContractingAuthority_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContractingAuthority` ADD CONSTRAINT `ContractingAuthority_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `ContractingAuthority`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subsector` ADD CONSTRAINT `Subsector_sectorId_fkey` FOREIGN KEY (`sectorId`) REFERENCES `Sector`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Market` ADD CONSTRAINT `Market_sectorId_fkey` FOREIGN KEY (`sectorId`) REFERENCES `Sector`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Market` ADD CONSTRAINT `Market_subsectorId_fkey` FOREIGN KEY (`subsectorId`) REFERENCES `Subsector`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Market` ADD CONSTRAINT `Market_contractingAuthorityId_fkey` FOREIGN KEY (`contractingAuthorityId`) REFERENCES `ContractingAuthority`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Market` ADD CONSTRAINT `Market_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `Region`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketLot` ADD CONSTRAINT `MarketLot_marketId_fkey` FOREIGN KEY (`marketId`) REFERENCES `Market`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketLot` ADD CONSTRAINT `MarketLot_attributaireCompanyId_fkey` FOREIGN KEY (`attributaireCompanyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketVersion` ADD CONSTRAINT `MarketVersion_marketId_fkey` FOREIGN KEY (`marketId`) REFERENCES `Market`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketEvent` ADD CONSTRAINT `MarketEvent_marketId_fkey` FOREIGN KEY (`marketId`) REFERENCES `Market`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketEvent` ADD CONSTRAINT `MarketEvent_sourceDocumentId_fkey` FOREIGN KEY (`sourceDocumentId`) REFERENCES `Document`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notice` ADD CONSTRAINT `Notice_marketId_fkey` FOREIGN KEY (`marketId`) REFERENCES `Market`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notice` ADD CONSTRAINT `Notice_publicationId_fkey` FOREIGN KEY (`publicationId`) REFERENCES `Publication`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notice` ADD CONSTRAINT `Notice_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `Document`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Correction` ADD CONSTRAINT `Correction_marketId_fkey` FOREIGN KEY (`marketId`) REFERENCES `Market`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Correction` ADD CONSTRAINT `Correction_sourceDocumentId_fkey` FOREIGN KEY (`sourceDocumentId`) REFERENCES `Document`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cancellation` ADD CONSTRAINT `Cancellation_marketId_fkey` FOREIGN KEY (`marketId`) REFERENCES `Market`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cancellation` ADD CONSTRAINT `Cancellation_sourceDocumentId_fkey` FOREIGN KEY (`sourceDocumentId`) REFERENCES `Document`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Republication` ADD CONSTRAINT `Republication_marketId_fkey` FOREIGN KEY (`marketId`) REFERENCES `Market`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Republication` ADD CONSTRAINT `Republication_sourceDocumentId_fkey` FOREIGN KEY (`sourceDocumentId`) REFERENCES `Document`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Requirement` ADD CONSTRAINT `Requirement_marketId_fkey` FOREIGN KEY (`marketId`) REFERENCES `Market`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Requirement` ADD CONSTRAINT `Requirement_lotId_fkey` FOREIGN KEY (`lotId`) REFERENCES `MarketLot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketRequiredDocument` ADD CONSTRAINT `MarketRequiredDocument_marketId_fkey` FOREIGN KEY (`marketId`) REFERENCES `Market`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketRequiredDocument` ADD CONSTRAINT `MarketRequiredDocument_lotId_fkey` FOREIGN KEY (`lotId`) REFERENCES `MarketLot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketReservation` ADD CONSTRAINT `MarketReservation_marketId_fkey` FOREIGN KEY (`marketId`) REFERENCES `Market`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketReservation` ADD CONSTRAINT `MarketReservation_lotId_fkey` FOREIGN KEY (`lotId`) REFERENCES `MarketLot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Company` ADD CONSTRAINT `Company_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompanyAlias` ADD CONSTRAINT `CompanyAlias_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompanyMerge` ADD CONSTRAINT `CompanyMerge_sourceCompanyId_fkey` FOREIGN KEY (`sourceCompanyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompanyMerge` ADD CONSTRAINT `CompanyMerge_targetCompanyId_fkey` FOREIGN KEY (`targetCompanyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompanySector` ADD CONSTRAINT `CompanySector_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompanySector` ADD CONSTRAINT `CompanySector_sectorId_fkey` FOREIGN KEY (`sectorId`) REFERENCES `Sector`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompanyLicense` ADD CONSTRAINT `CompanyLicense_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompanyReference` ADD CONSTRAINT `CompanyReference_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompanyParticipation` ADD CONSTRAINT `CompanyParticipation_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bid` ADD CONSTRAINT `Bid_marketId_fkey` FOREIGN KEY (`marketId`) REFERENCES `Market`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bid` ADD CONSTRAINT `Bid_lotId_fkey` FOREIGN KEY (`lotId`) REFERENCES `MarketLot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bid` ADD CONSTRAINT `Bid_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BidCorrection` ADD CONSTRAINT `BidCorrection_bidId_fkey` FOREIGN KEY (`bidId`) REFERENCES `Bid`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Evaluation` ADD CONSTRAINT `Evaluation_bidId_fkey` FOREIGN KEY (`bidId`) REFERENCES `Bid`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Result` ADD CONSTRAINT `Result_marketId_fkey` FOREIGN KEY (`marketId`) REFERENCES `Market`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Result` ADD CONSTRAINT `Result_lotId_fkey` FOREIGN KEY (`lotId`) REFERENCES `MarketLot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Result` ADD CONSTRAINT `Result_winnerCompanyId_fkey` FOREIGN KEY (`winnerCompanyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Result` ADD CONSTRAINT `Result_sourceDocumentId_fkey` FOREIGN KEY (`sourceDocumentId`) REFERENCES `Document`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Appeal` ADD CONSTRAINT `Appeal_marketId_fkey` FOREIGN KEY (`marketId`) REFERENCES `Market`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Appeal` ADD CONSTRAINT `Appeal_requesterCompanyId_fkey` FOREIGN KEY (`requesterCompanyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Appeal` ADD CONSTRAINT `Appeal_sourceDocumentId_fkey` FOREIGN KEY (`sourceDocumentId`) REFERENCES `Document`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AppealDecision` ADD CONSTRAINT `AppealDecision_appealId_fkey` FOREIGN KEY (`appealId`) REFERENCES `Appeal`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_marketId_fkey` FOREIGN KEY (`marketId`) REFERENCES `Market`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Funding` ADD CONSTRAINT `Funding_marketId_fkey` FOREIGN KEY (`marketId`) REFERENCES `Market`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Funding` ADD CONSTRAINT `Funding_donorId_fkey` FOREIGN KEY (`donorId`) REFERENCES `Donor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Funding` ADD CONSTRAINT `Funding_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PpmPlan` ADD CONSTRAINT `PpmPlan_contractingAuthorityId_fkey` FOREIGN KEY (`contractingAuthorityId`) REFERENCES `ContractingAuthority`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PpmPlan` ADD CONSTRAINT `PpmPlan_publicationId_fkey` FOREIGN KEY (`publicationId`) REFERENCES `Publication`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PpmItem` ADD CONSTRAINT `PpmItem_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `PpmPlan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PpmItem` ADD CONSTRAINT `PpmItem_sectorId_fkey` FOREIGN KEY (`sectorId`) REFERENCES `Sector`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PpmItem` ADD CONSTRAINT `PpmItem_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PpmItem` ADD CONSTRAINT `PpmItem_linkedMarketId_fkey` FOREIGN KEY (`linkedMarketId`) REFERENCES `Market`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PpmItem` ADD CONSTRAINT `PpmItem_sourceDocumentId_fkey` FOREIGN KEY (`sourceDocumentId`) REFERENCES `Document`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GeneralNotice` ADD CONSTRAINT `GeneralNotice_contractingAuthorityId_fkey` FOREIGN KEY (`contractingAuthorityId`) REFERENCES `ContractingAuthority`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GeneralNotice` ADD CONSTRAINT `GeneralNotice_publicationId_fkey` FOREIGN KEY (`publicationId`) REFERENCES `Publication`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupplierDirectory` ADD CONSTRAINT `SupplierDirectory_contractingAuthorityId_fkey` FOREIGN KEY (`contractingAuthorityId`) REFERENCES `ContractingAuthority`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupplierDirectory` ADD CONSTRAINT `SupplierDirectory_publicationId_fkey` FOREIGN KEY (`publicationId`) REFERENCES `Publication`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupplierDirectory` ADD CONSTRAINT `SupplierDirectory_sourceDocumentId_fkey` FOREIGN KEY (`sourceDocumentId`) REFERENCES `Document`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupplierDirectoryEntry` ADD CONSTRAINT `SupplierDirectoryEntry_directoryId_fkey` FOREIGN KEY (`directoryId`) REFERENCES `SupplierDirectory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupplierDirectoryEntry` ADD CONSTRAINT `SupplierDirectoryEntry_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tenant` ADD CONSTRAINT `Tenant_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TenantSector` ADD CONSTRAINT `TenantSector_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TenantSector` ADD CONSTRAINT `TenantSector_sectorId_fkey` FOREIGN KEY (`sectorId`) REFERENCES `Sector`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TenantLicense` ADD CONSTRAINT `TenantLicense_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TenantReference` ADD CONSTRAINT `TenantReference_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TenantEquipment` ADD CONSTRAINT `TenantEquipment_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TenantPersonnel` ADD CONSTRAINT `TenantPersonnel_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TenantCertification` ADD CONSTRAINT `TenantCertification_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TenantZone` ADD CONSTRAINT `TenantZone_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TenantMember` ADD CONSTRAINT `TenantMember_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TenantMember` ADD CONSTRAINT `TenantMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoginEvent` ADD CONSTRAINT `LoginEvent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Watchlist` ADD CONSTRAINT `Watchlist_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WatchlistTarget` ADD CONSTRAINT `WatchlistTarget_watchlistId_fkey` FOREIGN KEY (`watchlistId`) REFERENCES `Watchlist`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WatchlistTarget` ADD CONSTRAINT `WatchlistTarget_marketId_fkey` FOREIGN KEY (`marketId`) REFERENCES `Market`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WatchlistTarget` ADD CONSTRAINT `WatchlistTarget_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Alert` ADD CONSTRAINT `Alert_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_alertId_fkey` FOREIGN KEY (`alertId`) REFERENCES `Alert`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Score` ADD CONSTRAINT `Score_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Score` ADD CONSTRAINT `Score_marketId_fkey` FOREIGN KEY (`marketId`) REFERENCES `Market`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchResult` ADD CONSTRAINT `MatchResult_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchResult` ADD CONSTRAINT `MatchResult_marketId_fkey` FOREIGN KEY (`marketId`) REFERENCES `Market`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Recommendation` ADD CONSTRAINT `Recommendation_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Recommendation` ADD CONSTRAINT `Recommendation_marketId_fkey` FOREIGN KEY (`marketId`) REFERENCES `Market`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `Subscription`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TenantDocument` ADD CONSTRAINT `TenantDocument_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubmissionFolder` ADD CONSTRAINT `SubmissionFolder_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistItem` ADD CONSTRAINT `ChecklistItem_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `SubmissionFolder`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FolderDocument` ADD CONSTRAINT `FolderDocument_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `SubmissionFolder`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FolderDocument` ADD CONSTRAINT `FolderDocument_tenantDocumentId_fkey` FOREIGN KEY (`tenantDocumentId`) REFERENCES `TenantDocument`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiConversation` ADD CONSTRAINT `AiConversation_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiConversation` ADD CONSTRAINT `AiConversation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiMessage` ADD CONSTRAINT `AiMessage_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `AiConversation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiSource` ADD CONSTRAINT `AiSource_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `AiMessage`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExtractionJob` ADD CONSTRAINT `ExtractionJob_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `Document`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DataQualityCheck` ADD CONSTRAINT `DataQualityCheck_validatedById_fkey` FOREIGN KEY (`validatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_actorUserId_fkey` FOREIGN KEY (`actorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BlockHash` ADD CONSTRAINT `BlockHash_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `Document`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
