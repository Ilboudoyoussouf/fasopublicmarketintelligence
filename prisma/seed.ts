/* eslint-disable no-console */
// Seed de démonstration — reconstitue une tranche réaliste des publications
// DGCMEF citées en Annexe D (n°4477, 4476, 4475, 4473-4474, 4468/4468 bis)
// et le graphe métier complet qui en découle, pour que chaque écran du
// cahier des charges ait des données à afficher.

import {
  PrismaClient,
  Prisma,
  PublicationKind,
  ExtractionStatus,
  OrganizationType,
  SectorGroup,
  ProcedureType,
  MarketStatus,
  PublicationType,
  FinancingSource,
  RequirementType,
  RequiredDocType,
  ReservationCategory,
  ParticipationRole,
  RejectionReason,
  PpmStatus,
  TenantRole,
  PlanTier,
  SubscriptionStatus,
  PaymentProvider,
  PaymentStatus,
  DocumentLifecycleStatus,
  WatchlistType,
  AlertType,
  AlertPriority,
  NotificationChannel,
  NotificationStatus,
  MatchVerdict,
  AiRole,
  ExtractionJobStage,
  ExtractionJobStatus,
  DataQualityStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const SECTORS: Record<SectorGroup, string[]> = {
  FOURNITURES_SERVICES: [
    "Informatique", "Réseaux", "Logiciels", "Télécommunications", "Mobilier",
    "Fournitures scolaires", "Matériel médical", "Véhicules", "Équipements électriques",
    "Énergie", "Matériel agricole", "Produits alimentaires", "Consommables",
    "Sécurité", "Maintenance", "Transport", "Nettoyage", "Communication",
    "Formation", "Autres",
  ],
  TRAVAUX: [
    "Bâtiments", "Routes", "Ouvrages", "Hydraulique", "Assainissement",
    "Électricité", "Énergie solaire", "Réhabilitation", "Construction",
    "Génie civil", "Équipements associés", "Autres",
  ],
  PRESTATIONS_INTELLECTUELLES: [
    "Études", "Audit", "Conseil", "Ingénierie", "Maîtrise d'œuvre",
    "Assistance technique", "Formation", "Développement informatique",
    "Expertise", "Recherche", "Évaluation", "Autres",
  ],
};

async function main() {
  console.log("→ Référentiel pays / géographie");
  const bf = await db.country.upsert({
    where: { code: "BF" },
    update: {},
    create: {
      code: "BF",
      name: "Burkina Faso",
      regulationFramework: "Décret n°2017-0049/PRES/PM/MINEFID portant Code des marchés publics",
      primarySourceName: "DGCMEF",
      primarySourceUrl: "https://www.dgcmef.gov.bf",
      currency: "XOF",
    },
  });

  const regionCentre = await db.region.upsert({
    where: { countryId_name: { countryId: bf.id, name: "Centre" } },
    update: {},
    create: { countryId: bf.id, name: "Centre" },
  });
  const regionHautsBassins = await db.region.upsert({
    where: { countryId_name: { countryId: bf.id, name: "Hauts-Bassins" } },
    update: {},
    create: { countryId: bf.id, name: "Hauts-Bassins" },
  });
  const regionCentreEst = await db.region.upsert({
    where: { countryId_name: { countryId: bf.id, name: "Centre-Est" } },
    update: {},
    create: { countryId: bf.id, name: "Centre-Est" },
  });
  const regionSahel = await db.region.upsert({
    where: { countryId_name: { countryId: bf.id, name: "Sahel" } },
    update: {},
    create: { countryId: bf.id, name: "Sahel" },
  });

  const provKadiogo = await db.province.upsert({
    where: { regionId_name: { regionId: regionCentre.id, name: "Kadiogo" } },
    update: {},
    create: { regionId: regionCentre.id, name: "Kadiogo" },
  });
  await db.commune.upsert({
    where: { provinceId_name: { provinceId: provKadiogo.id, name: "Ouagadougou" } },
    update: {},
    create: { provinceId: provKadiogo.id, name: "Ouagadougou" },
  });

  console.log("→ Taxonomie (secteurs / sous-secteurs)");
  const sectorByName = new Map<string, string>(); // "group:name" -> id
  for (const group of Object.keys(SECTORS) as SectorGroup[]) {
    for (const name of SECTORS[group]) {
      const s = await db.sector.upsert({
        where: { group_name: { group, name } },
        update: {},
        create: { group, name },
      });
      sectorByName.set(`${group}:${name}`, s.id);
    }
  }
  const secInformatique = sectorByName.get("FOURNITURES_SERVICES:Informatique")!;
  const secReseaux = sectorByName.get("FOURNITURES_SERVICES:Réseaux")!;
  const secVehicules = sectorByName.get("FOURNITURES_SERVICES:Véhicules")!;
  const secMedical = sectorByName.get("FOURNITURES_SERVICES:Matériel médical")!;
  const secBatiments = sectorByName.get("TRAVAUX:Bâtiments")!;
  const secRoutes = sectorByName.get("TRAVAUX:Routes")!;
  const secHydraulique = sectorByName.get("TRAVAUX:Hydraulique")!;
  const secAudit = sectorByName.get("PRESTATIONS_INTELLECTUELLES:Audit")!;
  const secDevInfo = sectorByName.get("PRESTATIONS_INTELLECTUELLES:Développement informatique")!;
  const secMaitriseOeuvre = sectorByName.get("PRESTATIONS_INTELLECTUELLES:Maîtrise d'œuvre")!;

  console.log("→ Organismes (autorités contractantes)");
  const ministereEducation = await db.contractingAuthority.upsert({
    where: { countryId_name: { countryId: bf.id, name: "Ministère de l'Éducation Nationale, de l'Alphabétisation et de la Promotion des Langues Nationales" } },
    update: {},
    create: { countryId: bf.id, name: "Ministère de l'Éducation Nationale, de l'Alphabétisation et de la Promotion des Langues Nationales", type: OrganizationType.MINISTERE, regionName: "Centre" },
  });
  const ministereSante = await db.contractingAuthority.upsert({
    where: { countryId_name: { countryId: bf.id, name: "Ministère de la Santé" } },
    update: {},
    create: { countryId: bf.id, name: "Ministère de la Santé", type: OrganizationType.MINISTERE, regionName: "Centre" },
  });
  const ministereInfra = await db.contractingAuthority.upsert({
    where: { countryId_name: { countryId: bf.id, name: "Ministère des Infrastructures et du Désenclavement" } },
    update: {},
    create: { countryId: bf.id, name: "Ministère des Infrastructures et du Désenclavement", type: OrganizationType.MINISTERE, regionName: "Centre" },
  });
  const ministereAgriculture = await db.contractingAuthority.upsert({
    where: { countryId_name: { countryId: bf.id, name: "Ministère de l'Agriculture, des Ressources Animales et Halieutiques" } },
    update: {},
    create: { countryId: bf.id, name: "Ministère de l'Agriculture, des Ressources Animales et Halieutiques", type: OrganizationType.MINISTERE, regionName: "Centre" },
  });
  const onea = await db.contractingAuthority.upsert({
    where: { countryId_name: { countryId: bf.id, name: "Office National de l'Eau et de l'Assainissement (ONEA)" } },
    update: {},
    create: { countryId: bf.id, name: "Office National de l'Eau et de l'Assainissement (ONEA)", type: OrganizationType.EPE, regionName: "Centre" },
  });
  const sonabel = await db.contractingAuthority.upsert({
    where: { countryId_name: { countryId: bf.id, name: "Société Nationale Burkinabè d'Électricité (SONABEL)" } },
    update: {},
    create: { countryId: bf.id, name: "Société Nationale Burkinabè d'Électricité (SONABEL)", type: OrganizationType.EPE, regionName: "Centre" },
  });
  const communeOuaga = await db.contractingAuthority.upsert({
    where: { countryId_name: { countryId: bf.id, name: "Commune de Ouagadougou" } },
    update: {},
    create: { countryId: bf.id, name: "Commune de Ouagadougou", type: OrganizationType.COMMUNE, regionName: "Centre" },
  });
  const communeBobo = await db.contractingAuthority.upsert({
    where: { countryId_name: { countryId: bf.id, name: "Commune de Bobo-Dioulasso" } },
    update: {},
    create: { countryId: bf.id, name: "Commune de Bobo-Dioulasso", type: OrganizationType.COMMUNE, regionName: "Hauts-Bassins" },
  });

  console.log("→ Source & publications DGCMEF (Annexe D)");
  const dgcmef = await db.source.upsert({
    where: { id: "seed-source-dgcmef" },
    update: {},
    create: {
      id: "seed-source-dgcmef",
      countryId: bf.id,
      name: "DGCMEF",
      baseUrl: "https://www.dgcmef.gov.bf",
      isActive: true,
      lastCrawledAt: new Date("2026-08-31T08:00:00Z"),
    },
  });

  async function upsertPublication(numero: string, publishedAt: string, isDoubleIssue = false) {
    return db.publication.upsert({
      where: { sourceId_numero_kind: { sourceId: dgcmef.id, numero, kind: PublicationKind.QUOTIDIEN_MARCHES } },
      update: {},
      create: {
        sourceId: dgcmef.id,
        kind: PublicationKind.QUOTIDIEN_MARCHES,
        numero,
        isDoubleIssue,
        publishedAt: new Date(publishedAt),
        title: `Revue de marchés pour tous — Quotidien n°${numero}`,
      },
    });
  }

  const pub4477 = await upsertPublication("4477", "2026-08-31T07:00:00Z");
  const pub4476 = await upsertPublication("4476", "2026-08-28T07:00:00Z");
  const pub4475 = await upsertPublication("4475", "2026-08-27T07:00:00Z");
  const pub4473_4474 = await upsertPublication("4473-4474", "2026-08-25T07:00:00Z", true);
  const pub4468 = await upsertPublication("4468", "2026-08-18T07:00:00Z");

  async function upsertDocument(publicationId: string, filename: string, isBis = false) {
    const url = `https://www.dgcmef.gov.bf/quotidiens/${filename}`;
    return db.document.upsert({
      where: { url },
      update: {},
      create: {
        publicationId,
        filename,
        url,
        fileHash: `sha256-demo-${filename}`,
        sizeBytes: 2_400_000,
        mimeType: "application/pdf",
        isPrincipal: !isBis,
        isBis,
        extractionStatus: ExtractionStatus.VALIDATED,
        downloadedAt: new Date(),
      },
    });
  }

  const doc4477 = await upsertDocument(pub4477.id, "quotidien-4477.pdf");
  const doc4476 = await upsertDocument(pub4476.id, "quotidien-4476.pdf");
  const doc4475 = await upsertDocument(pub4475.id, "quotidien-4475.pdf");
  const doc4473_4474 = await upsertDocument(pub4473_4474.id, "quotidien-4473-4474.pdf");
  const doc4468 = await upsertDocument(pub4468.id, "quotidien-4468.pdf");
  const doc4468bis = await upsertDocument(pub4468.id, "quotidien-4468-bis.pdf", true);

  for (const doc of [doc4477, doc4476, doc4475, doc4473_4474, doc4468, doc4468bis]) {
    await db.documentPage.upsert({
      where: { documentId_pageNumber: { documentId: doc.id, pageNumber: 1 } },
      update: {},
      create: { documentId: doc.id, pageNumber: 1, rawText: "Texte extrait (démonstration) …", ocrConfidence: 0.97 },
    });
    for (const stage of [
      ExtractionJobStage.DOWNLOAD,
      ExtractionJobStage.PARSE,
      ExtractionJobStage.CLASSIFY,
      ExtractionJobStage.EXTRACT,
      ExtractionJobStage.VALIDATE,
    ]) {
      await db.extractionJob.create({
        data: {
          documentId: doc.id,
          stage,
          status: ExtractionJobStatus.SUCCEEDED,
          attempts: 1,
          startedAt: new Date(),
          finishedAt: new Date(),
        },
      });
    }
  }

  console.log("→ Entreprises (annuaire public) + résolution d'entité");
  async function upsertCompany(canonicalName: string, ifu: string, aliases: string[], regionName = "Centre") {
    const company = await db.company.upsert({
      where: { countryId_canonicalName: { countryId: bf.id, canonicalName } },
      update: {},
      create: { countryId: bf.id, canonicalName, ifu, regionName },
    });
    for (const alias of aliases) {
      await db.companyAlias.upsert({
        where: { companyId_aliasName: { companyId: company.id, aliasName: alias } },
        update: {},
        create: { companyId: company.id, aliasName: alias },
      });
    }
    return company;
  }

  const compXyz = await upsertCompany("ENTREPRISE XYZ SARL", "00012345A", ["XYZ SARL", "ETS XYZ", "XYZ"]);
  const compBurkinaTech = await upsertCompany("BURKINA TECH SOLUTIONS SARL", "00023456B", ["BURKINA TECH", "BTS SARL"]);
  const compSahelBtp = await upsertCompany("SAHEL BTP SA", "00034567C", ["SAHEL BTP"], "Hauts-Bassins");
  const compFasoInfo = await upsertCompany("FASO INFORMATIQUE SARL", "00045678D", ["FASO INFO"]);
  const compKambou = await upsertCompany("GROUPE KAMBOU ET FILS", "00056789E", ["KAMBOU & FILS"], "Hauts-Bassins");
  const compNordConstruction = await upsertCompany("NORD CONSTRUCTION SARL", "00067890F", ["NORD CONSTRUCTION"]);
  const compOugaMedical = await upsertCompany("OUAGA MEDICAL EQUIPEMENT SARL", "00078901G", ["OUAGA MEDICAL"]);
  const compCec = await upsertCompany("CENTRE ETUDES ET CONSEILS", "00089012H", ["CEC"]);

  await db.companySector.upsert({
    where: { companyId_sectorId: { companyId: compFasoInfo.id, sectorId: secInformatique } },
    update: {},
    create: { companyId: compFasoInfo.id, sectorId: secInformatique },
  });

  console.log("→ Marchés");

  // M1 — Acquisition de matériel informatique (échéance proche, correspond à l'exemple WhatsApp §53)
  const m1 = await db.market.create({
    data: {
      reference: "ME-2026-00417",
      procedureNumber: "n°2026-417/MENAPLN",
      title: "Acquisition de matériel informatique et mise en réseau au profit des directions régionales de l'éducation",
      description:
        "Fourniture, installation et mise en service d'équipements informatiques et réseau (postes de travail, serveurs, switchs, câblage) au profit de 8 directions régionales.",
      publicationType: PublicationType.AVIS_APPEL_OFFRES,
      procedureType: ProcedureType.APPEL_OFFRES_OUVERT,
      sectorId: secInformatique,
      subsectorId: null,
      keywords: ["informatique", "réseau", "ordinateurs", "serveurs"],
      status: MarketStatus.PUBLIE,
      contractingAuthorityId: ministereEducation.id,
      financingSource: FinancingSource.NATIONAL,
      amountEstimatedExclTax: 65_300_000,
      amountEstimatedInclTax: 65_300_000,
      regionId: regionCentre.id,
      siteDetail: "Ouagadougou et 8 chefs-lieux de région",
      publishedAt: new Date("2026-08-31T07:00:00Z"),
      withdrawalDeadline: new Date("2026-09-02T16:00:00Z"),
      submissionDeadline: new Date("2026-09-09T09:00:00Z"),
      submissionTime: "09:00",
      openingAt: new Date("2026-09-09T09:30:00Z"),
      bidValidityDays: 90,
      executionDelayDays: 60,
      sourcePublicationId: pub4477.id,
      sourceDocumentId: doc4477.id,
      sourcePage: 4,
    },
  });
  await db.notice.create({
    data: {
      marketId: m1.id, publicationId: pub4477.id, documentId: doc4477.id, pageNumber: 4,
      publicationType: PublicationType.AVIS_APPEL_OFFRES, publishedAt: m1.publishedAt!,
      rawExcerpt: "Avis d'appel d'offres ouvert n°2026-417/MENAPLN...",
    },
  });
  await db.marketEvent.create({
    data: { marketId: m1.id, type: "MARKET_CREATED", occurredAt: m1.publishedAt!, sourceDocumentId: doc4477.id, description: "Publication de l'avis initial." },
  });
  await db.marketVersion.create({ data: { marketId: m1.id, versionNumber: 1, snapshot: { title: m1.title, amount: 65_300_000 } } });
  await db.requirement.createMany({
    data: [
      { marketId: m1.id, type: RequirementType.CHIFFRE_AFFAIRES, rawText: "Chiffre d'affaires moyen ≥ 50 000 000 FCFA sur 3 ans", thresholdValue: 50_000_000, thresholdUnit: "FCFA", confidence: 0.92 },
      { marketId: m1.id, type: RequirementType.EXPERIENCE_SPECIFIQUE, rawText: "Au moins 2 marchés similaires exécutés au cours des 5 dernières années", confidence: 0.88 },
      { marketId: m1.id, type: RequirementType.AGREMENT, rawText: "Agrément technique informatique en cours de validité", confidence: 0.95 },
    ],
  });
  await db.marketRequiredDocument.createMany({
    data: [
      { marketId: m1.id, docType: RequiredDocType.RCCM, mandatory: true },
      { marketId: m1.id, docType: RequiredDocType.IFU, mandatory: true },
      { marketId: m1.id, docType: RequiredDocType.ATTESTATION_FISCALE, mandatory: true },
      { marketId: m1.id, docType: RequiredDocType.AGREMENT, mandatory: true },
      { marketId: m1.id, docType: RequiredDocType.ATTESTATION_BONNE_EXECUTION, mandatory: false },
    ],
  });

  // M2 — Construction de salles de classe
  const m2 = await db.market.create({
    data: {
      reference: "ME-2026-00398", title: "Construction de 24 salles de classe et latrines dans la région du Centre-Est",
      publicationType: PublicationType.AVIS_APPEL_OFFRES, procedureType: ProcedureType.APPEL_OFFRES_OUVERT,
      sectorId: secBatiments, keywords: ["construction", "école", "bâtiment"], status: MarketStatus.PUBLIE,
      contractingAuthorityId: ministereEducation.id, financingSource: FinancingSource.EXTERIEUR,
      amountEstimatedExclTax: 128_000_000, regionId: regionCentreEst.id,
      publishedAt: new Date("2026-08-28T07:00:00Z"), submissionDeadline: new Date("2026-09-25T09:00:00Z"),
      sourcePublicationId: pub4476.id, sourceDocumentId: doc4476.id, sourcePage: 6,
    },
  });
  await db.marketReservation.create({ data: { marketId: m2.id, category: ReservationCategory.PME, rawText: "Marché réservé aux PME de droit burkinabè." } });

  // M3 — Réhabilitation de forages (rectifiée)
  const m3 = await db.market.create({
    data: {
      reference: "ONEA-2026-0112", title: "Réhabilitation de 40 forages équipés de pompes à motricité humaine",
      publicationType: PublicationType.DEMANDE_PRIX, procedureType: ProcedureType.DEMANDE_PRIX,
      sectorId: secHydraulique, keywords: ["hydraulique", "forage", "eau"], status: MarketStatus.RECTIFIE,
      contractingAuthorityId: onea.id, financingSource: FinancingSource.NATIONAL,
      amountEstimatedExclTax: 42_000_000, amountCorrected: 46_500_000, regionId: regionSahel.id,
      publishedAt: new Date("2026-08-18T07:00:00Z"), submissionDeadline: new Date("2026-09-15T09:00:00Z"),
      sourcePublicationId: pub4468.id, sourceDocumentId: doc4468.id, sourcePage: 9,
    },
  });
  await db.marketVersion.create({ data: { marketId: m3.id, versionNumber: 1, snapshot: { amount: 42_000_000, submissionDeadline: "2026-09-08" } } });
  await db.marketVersion.create({ data: { marketId: m3.id, versionNumber: 2, snapshot: { amount: 46_500_000, submissionDeadline: "2026-09-15" } } });
  await db.correction.create({
    data: {
      marketId: m3.id, fieldChanged: "amountEstimatedExclTax", beforeValue: "42 000 000 FCFA", afterValue: "46 500 000 FCFA",
      effectiveAt: new Date("2026-08-31T07:00:00Z"), consequence: "Révision du montant prévisionnel suite à actualisation des quantités.",
      sourceDocumentId: doc4477.id,
    },
  });
  await db.marketEvent.createMany({
    data: [
      { marketId: m3.id, type: "MARKET_CREATED", occurredAt: new Date("2026-08-18T07:00:00Z"), sourceDocumentId: doc4468.id },
      { marketId: m3.id, type: "MARKET_CORRECTED", occurredAt: new Date("2026-08-31T07:00:00Z"), sourceDocumentId: doc4477.id, description: "Rectificatif n°1 : montant et délai de dépôt." },
    ],
  });

  // M4 — Fourniture de produits pharmaceutiques (annulée)
  const m4 = await db.market.create({
    data: {
      reference: "MS-2026-0234", title: "Fourniture de produits pharmaceutiques essentiels pour les CSPS",
      publicationType: PublicationType.AVIS_APPEL_OFFRES, procedureType: ProcedureType.APPEL_OFFRES_OUVERT,
      sectorId: secMedical, keywords: ["médical", "pharmacie"], status: MarketStatus.ANNULE,
      contractingAuthorityId: ministereSante.id, financingSource: FinancingSource.EXTERIEUR,
      amountEstimatedExclTax: 210_000_000, regionId: regionCentre.id,
      publishedAt: new Date("2026-08-25T07:00:00Z"),
      sourcePublicationId: pub4473_4474.id, sourceDocumentId: doc4473_4474.id, sourcePage: 3,
    },
  });
  await db.cancellation.create({
    data: { marketId: m4.id, motif: "Insuffisance de crédits budgétaires disponibles pour l'exercice en cours.", cancelledAt: new Date("2026-08-31T07:00:00Z"), sourceDocumentId: doc4477.id },
  });
  await db.marketEvent.create({ data: { marketId: m4.id, type: "MARKET_CANCELLED", occurredAt: new Date("2026-08-31T07:00:00Z"), sourceDocumentId: doc4477.id } });

  // M5 — Audit financier (résultat publié)
  const m5 = await db.market.create({
    data: {
      reference: "MARAH-2026-0056", title: "Audit financier et organisationnel du programme d'appui à l'agriculture",
      publicationType: PublicationType.RESULTAT_PROVISOIRE, procedureType: ProcedureType.DEMANDE_PROPOSITIONS,
      sectorId: secAudit, keywords: ["audit", "conseil"], status: MarketStatus.RESULTAT_PUBLIE,
      contractingAuthorityId: ministereAgriculture.id, financingSource: FinancingSource.EXTERIEUR,
      amountEstimatedExclTax: 18_000_000, amountAwarded: 16_800_000, regionId: regionCentre.id,
      publishedAt: new Date("2026-08-01T07:00:00Z"), resultAt: new Date("2026-08-27T07:00:00Z"),
      sourcePublicationId: pub4475.id, sourceDocumentId: doc4475.id, sourcePage: 11,
    },
  });
  const bidCec = await db.bid.create({ data: { marketId: m5.id, companyId: compCec.id, amountRead: 16_800_000, amountCorrected: 16_800_000, conformity: true, rank: 1, submittedAt: new Date("2026-08-10T09:00:00Z") } });
  await db.bid.create({ data: { marketId: m5.id, companyId: compBurkinaTech.id, amountRead: 19_200_000, amountCorrected: 19_200_000, conformity: true, rank: 2, submittedAt: new Date("2026-08-10T09:10:00Z") } });
  await db.bid.create({ data: { marketId: m5.id, companyId: compXyz.id, amountRead: 15_500_000, conformity: false, rejectionReason: RejectionReason.PIECE_ADMINISTRATIVE_ABSENTE, rejectionDetail: "Attestation fiscale manquante au dépôt.", submittedAt: new Date("2026-08-10T08:50:00Z") } });
  await db.result.create({
    data: {
      marketId: m5.id, numberOfBids: 3, meanAmount: 17_166_666, threshold: 15_000_000, envelope: 18_000_000,
      winnerCompanyId: compCec.id, awardedAmount: 16_800_000, decision: "Attribution provisoire au Centre Études et Conseils.",
      resultAt: new Date("2026-08-27T07:00:00Z"), sourceDocumentId: doc4475.id,
    },
  });
  await db.companyParticipation.createMany({
    data: [
      { companyId: compCec.id, marketId: m5.id, role: ParticipationRole.WINNER, amount: 16_800_000 },
      { companyId: compBurkinaTech.id, marketId: m5.id, role: ParticipationRole.LOSER, amount: 19_200_000 },
      { companyId: compXyz.id, marketId: m5.id, role: ParticipationRole.DISQUALIFIED, amount: 15_500_000 },
    ],
  });
  await db.marketEvent.create({ data: { marketId: m5.id, type: "RESULT_PUBLISHED", occurredAt: new Date("2026-08-27T07:00:00Z"), sourceDocumentId: doc4475.id } });
  void bidCec;

  // M6 — Construction de routes rurales (attribuée, avec recours + réexamen)
  const m6 = await db.market.create({
    data: {
      reference: "COM-BOB-2026-014", title: "Construction et bitumage de voiries rurales — lot unique",
      publicationType: PublicationType.ATTRIBUTION, procedureType: ProcedureType.APPEL_OFFRES_OUVERT,
      sectorId: secRoutes, keywords: ["routes", "voirie", "bitumage"], status: MarketStatus.ATTRIBUE,
      contractingAuthorityId: communeBobo.id, financingSource: FinancingSource.COMMUNAL,
      amountEstimatedExclTax: 340_000_000, amountAwarded: 332_500_000, regionId: regionHautsBassins.id,
      publishedAt: new Date("2026-07-15T07:00:00Z"), resultAt: new Date("2026-08-20T07:00:00Z"),
      sourcePublicationId: pub4473_4474.id, sourceDocumentId: doc4473_4474.id, sourcePage: 15,
    },
  });
  await db.result.create({
    data: { marketId: m6.id, numberOfBids: 4, winnerCompanyId: compSahelBtp.id, awardedAmount: 332_500_000, decision: "Attribution définitive.", resultAt: new Date("2026-08-20T07:00:00Z"), sourceDocumentId: doc4473_4474.id },
  });
  const appeal = await db.appeal.create({
    data: {
      marketId: m6.id, requesterCompanyId: compKambou.id, object: "Contestation du classement des offres techniques.",
      filedAt: new Date("2026-08-22T00:00:00Z"), authority: "Autorité de Régulation de la Commande Publique (ARCOP)",
      resultBefore: "Attributaire pressenti : Groupe Kambou et Fils", resultAfter: "Attributaire confirmé : Sahel BTP SA",
      sourceDocumentId: doc4477.id,
    },
  });
  await db.appealDecision.create({ data: { appealId: appeal.id, decision: "Recours rejeté — évaluation confirmée conforme.", decidedAt: new Date("2026-08-29T00:00:00Z"), consequence: "Maintien de l'attributaire initial." } });
  await db.review.create({ data: { marketId: m6.id, requestedAt: new Date("2026-08-22T00:00:00Z"), completedAt: new Date("2026-08-29T00:00:00Z"), outcome: "Réexamen confirmant l'attribution à Sahel BTP SA." } });
  await db.marketEvent.createMany({
    data: [
      { marketId: m6.id, type: "AWARD_PUBLISHED", occurredAt: new Date("2026-08-20T07:00:00Z"), sourceDocumentId: doc4473_4474.id },
      { marketId: m6.id, type: "APPEAL_FILED", occurredAt: new Date("2026-08-22T00:00:00Z") },
      { marketId: m6.id, type: "APPEAL_DECIDED", occurredAt: new Date("2026-08-29T00:00:00Z") },
    ],
  });

  // M7 — Plateforme de gestion (réservé PME, prestations intellectuelles)
  const m7 = await db.market.create({
    data: {
      reference: "SONABEL-2026-0071", title: "Développement d'une plateforme de gestion des interventions techniques",
      publicationType: PublicationType.DEMANDE_PROPOSITIONS, procedureType: ProcedureType.DEMANDE_PROPOSITIONS,
      sectorId: secDevInfo, keywords: ["développement", "logiciel", "plateforme"], status: MarketStatus.PUBLIE,
      contractingAuthorityId: sonabel.id, financingSource: FinancingSource.NATIONAL,
      amountEstimatedExclTax: 38_000_000, regionId: regionCentre.id,
      publishedAt: new Date("2026-08-31T07:00:00Z"), submissionDeadline: new Date("2026-09-20T09:00:00Z"),
      sourcePublicationId: pub4477.id, sourceDocumentId: doc4477.id, sourcePage: 7,
    },
  });
  await db.marketReservation.create({ data: { marketId: m7.id, category: ReservationCategory.PME, rawText: "Marché réservé aux PME nationales du secteur numérique." } });
  await db.requirement.createMany({
    data: [
      { marketId: m7.id, type: RequirementType.EXPERIENCE_SPECIFIQUE, rawText: "Au moins 3 références en développement d'applications de gestion", confidence: 0.85 },
      { marketId: m7.id, type: RequirementType.PERSONNEL, rawText: "Une équipe d'au moins 4 développeurs et 1 chef de projet certifié", confidence: 0.8 },
    ],
  });

  // M8 — Véhicules 4x4
  const m8 = await db.market.create({
    data: {
      reference: "MID-2026-0189", title: "Acquisition de véhicules 4x4 double cabine pour les brigades régionales",
      publicationType: PublicationType.AVIS_APPEL_OFFRES, procedureType: ProcedureType.APPEL_OFFRES_OUVERT,
      sectorId: secVehicules, keywords: ["véhicules", "4x4"], status: MarketStatus.PUBLIE,
      contractingAuthorityId: ministereInfra.id, financingSource: FinancingSource.NATIONAL,
      amountEstimatedExclTax: 96_000_000, regionId: regionCentre.id,
      publishedAt: new Date("2026-08-28T07:00:00Z"), submissionDeadline: new Date("2026-09-05T09:00:00Z"),
      sourcePublicationId: pub4476.id, sourceDocumentId: doc4476.id, sourcePage: 2,
    },
  });

  // M9 — Manifestation d'intérêt
  const m9 = await db.market.create({
    data: {
      reference: "COM-OUAGA-2026-0033", title: "Manifestation d'intérêt pour la maîtrise d'œuvre de la réhabilitation du marché central",
      publicationType: PublicationType.MANIFESTATION_INTERET, procedureType: ProcedureType.MANIFESTATION_INTERET,
      sectorId: secMaitriseOeuvre, keywords: ["maîtrise d'œuvre", "réhabilitation"], status: MarketStatus.PUBLIE,
      contractingAuthorityId: communeOuaga.id, financingSource: FinancingSource.COMMUNAL,
      amountEstimatedExclTax: 12_500_000, regionId: regionCentre.id,
      publishedAt: new Date("2026-08-27T07:00:00Z"), submissionDeadline: new Date("2026-09-12T09:00:00Z"),
      sourcePublicationId: pub4475.id, sourceDocumentId: doc4475.id, sourcePage: 5,
    },
  });

  // Lots pour M2 (multi-lots)
  await db.marketLot.createMany({
    data: [
      { marketId: m2.id, numero: "Lot 1", objet: "Construction — zone urbaine", montant: 70_000_000, quantite: 12, unite: "salles" },
      { marketId: m2.id, numero: "Lot 2", objet: "Construction — zone rurale", montant: 58_000_000, quantite: 12, unite: "salles" },
    ],
  });

  console.log("→ Plan de passation des marchés (PPM) & avis général");
  const ppmPlan = await db.ppmPlan.create({
    data: { contractingAuthorityId: ministereSante.id, exercice: 2026, status: PpmStatus.EN_SOUMISSION, publicationId: pub4468.id },
  });
  await db.ppmItem.createMany({
    data: [
      { planId: ppmPlan.id, object: "Fourniture de produits pharmaceutiques essentiels pour les CSPS", sectorId: secMedical, procedureType: ProcedureType.APPEL_OFFRES_OUVERT, budget: 210_000_000, periodPlanned: "T3 2026", financingSource: FinancingSource.EXTERIEUR, status: PpmStatus.RESULTAT, linkedMarketId: m4.id },
      { planId: ppmPlan.id, object: "Acquisition d'équipements de laboratoire pour les CHR", sectorId: secMedical, procedureType: ProcedureType.APPEL_OFFRES_OUVERT, budget: 87_000_000, periodPlanned: "T4 2026", financingSource: FinancingSource.NATIONAL, status: PpmStatus.PLANIFIE },
      { planId: ppmPlan.id, object: "Réhabilitation de 6 centres de santé", sectorId: secBatiments, procedureType: ProcedureType.APPEL_OFFRES_OUVERT, budget: 156_000_000, periodPlanned: "T1 2027", financingSource: FinancingSource.EXTERIEUR, status: PpmStatus.PLANIFIE },
    ],
  });
  await db.generalNotice.create({ data: { contractingAuthorityId: ministereEducation.id, exercice: 2026, publicationId: pub4468.id, publishedAt: new Date("2026-08-18T07:00:00Z") } });

  console.log("→ Configuration du scoring (section 73)");
  await db.scoreConfig.upsert({
    where: { version: "1.0" },
    update: {},
    create: {
      version: "1.0",
      isActive: true,
      weights: {
        pertinence: { secteur: 0.3, objet: 0.2, localisation: 0.1, calendrier: 0.4 },
        eligibilite: { agrement: 0.2, experience: 0.2, capacite: 0.2, documents: 0.2, autres: 0.2 },
        attractivite: { montant: 0.2, concurrence: 0.2, delai: 0.15, historique: 0.25, risque: 0.2 },
      },
    },
  });

  console.log("→ Locataire (tenant) de démonstration + utilisateurs");
  const tenant = await db.tenant.upsert({
    where: { countryId_name: { countryId: bf.id, name: "TECH SAHEL SOLUTIONS SARL" } },
    update: {},
    create: {
      countryId: bf.id, name: "TECH SAHEL SOLUTIONS SARL", regionName: "Centre", size: "PME (11-50 salariés)",
      revenueBand: "50M - 150M FCFA", experienceYears: 6,
      preferences: { canauxAlerte: ["APP", "EMAIL"], frequenceBriefing: "QUOTIDIEN" },
      targetCategories: ["Informatique", "Réseaux", "Développement informatique"],
    },
  });
  await db.tenantSector.upsert({ where: { tenantId_sectorId: { tenantId: tenant.id, sectorId: secInformatique } }, update: {}, create: { tenantId: tenant.id, sectorId: secInformatique } });
  await db.tenantSector.upsert({ where: { tenantId_sectorId: { tenantId: tenant.id, sectorId: secReseaux } }, update: {}, create: { tenantId: tenant.id, sectorId: secReseaux } });
  await db.tenantSector.upsert({ where: { tenantId_sectorId: { tenantId: tenant.id, sectorId: secDevInfo } }, update: {}, create: { tenantId: tenant.id, sectorId: secDevInfo } });
  await db.tenantLicense.create({ data: { tenantId: tenant.id, label: "Agrément technique — Informatique et réseaux", expirationDate: new Date("2027-03-01") } });
  await db.tenantReference.createMany({
    data: [
      { tenantId: tenant.id, marketTitle: "Câblage réseau — Direction régionale des impôts", clientName: "Ministère de l'Économie et des Finances", year: 2024, amount: 22_000_000 },
      { tenantId: tenant.id, marketTitle: "Fourniture de postes de travail", clientName: "Commune de Ouagadougou", year: 2025, amount: 18_500_000 },
    ],
  });
  await db.tenantEquipment.createMany({ data: [{ tenantId: tenant.id, label: "Véhicules utilitaires", quantity: 3 }, { tenantId: tenant.id, label: "Outillage de câblage réseau", quantity: 12 }] });
  await db.tenantPersonnel.createMany({ data: [{ tenantId: tenant.id, role: "Ingénieurs réseaux", count: 4, diplomas: "Bac+5" }, { tenantId: tenant.id, role: "Techniciens", count: 8, diplomas: "BTS" }] });
  await db.tenantCertification.create({ data: { tenantId: tenant.id, label: "ISO 9001:2015" } });
  await db.tenantZone.createMany({ data: [{ tenantId: tenant.id, regionName: "Centre" }, { tenantId: tenant.id, regionName: "Hauts-Bassins" }] });

  await db.tenantDocument.createMany({
    data: [
      { tenantId: tenant.id, docType: RequiredDocType.RCCM, label: "RCCM", status: DocumentLifecycleStatus.VALID, confidence: 0.99, lastVerifiedAt: new Date() },
      { tenantId: tenant.id, docType: RequiredDocType.IFU, label: "IFU", status: DocumentLifecycleStatus.VALID, confidence: 0.99, lastVerifiedAt: new Date() },
      { tenantId: tenant.id, docType: RequiredDocType.ATTESTATION_FISCALE, label: "Attestation de situation fiscale", status: DocumentLifecycleStatus.EXPIRING_SOON, expirationDate: new Date("2026-09-15"), confidence: 0.9 },
      { tenantId: tenant.id, docType: RequiredDocType.AGREMENT, label: "Agrément technique informatique", status: DocumentLifecycleStatus.EXPIRED, expirationDate: new Date("2026-06-30"), confidence: 0.95 },
    ],
  });

  const passwordHash = await bcrypt.hash("Demo1234!", 10);
  const adminPasswordHash = await bcrypt.hash("Admin1234!", 10);
  const demoUser = await db.user.upsert({
    where: { email: "demo@fasopmi.bf" },
    update: {},
    create: { email: "demo@fasopmi.bf", passwordHash, fullName: "Aïcha Ouédraogo", emailVerifiedAt: new Date(), phone: "+22670000001", phoneVerifiedAt: new Date() },
  });
  await db.tenantMember.upsert({ where: { tenantId_userId: { tenantId: tenant.id, userId: demoUser.id } }, update: {}, create: { tenantId: tenant.id, userId: demoUser.id, role: TenantRole.OWNER, joinedAt: new Date() } });

  const analystUser = await db.user.upsert({
    where: { email: "analyste@fasopmi.bf" },
    update: {},
    create: { email: "analyste@fasopmi.bf", passwordHash, fullName: "Boureima Sawadogo", emailVerifiedAt: new Date() },
  });
  await db.tenantMember.upsert({ where: { tenantId_userId: { tenantId: tenant.id, userId: analystUser.id } }, update: {}, create: { tenantId: tenant.id, userId: analystUser.id, role: TenantRole.ANALYST, joinedAt: new Date() } });

  await db.user.upsert({
    where: { email: "admin@fasopmi.bf" },
    update: {},
    create: { email: "admin@fasopmi.bf", passwordHash: adminPasswordHash, fullName: "Administrateur Plateforme", isPlatformAdmin: true, emailVerifiedAt: new Date() },
  });

  console.log("→ Abonnement & paiement");
  const subscription = await db.subscription.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: { tenantId: tenant.id, plan: PlanTier.PRO, status: SubscriptionStatus.ACTIVE, currentPeriodEnd: new Date("2027-08-31") },
  });
  await db.payment.create({ data: { subscriptionId: subscription.id, provider: PaymentProvider.MOBILE_MONEY, amount: 45_000, status: PaymentStatus.SUCCEEDED, externalRef: "OM-DEMO-00123", paidAt: new Date("2026-08-01") } });

  console.log("→ Scores, matching & recommandations");
  async function upsertScore(marketId: string, pertinence: number, eligibilite: number, attractivite: number, factors: Prisma.InputJsonValue) {
    const global = Math.round(pertinence * 0.4 + eligibilite * 0.35 + attractivite * 0.25);
    await db.score.upsert({
      where: { tenantId_marketId_scoreVersion: { tenantId: tenant.id, marketId, scoreVersion: "1.0" } },
      update: {},
      create: { tenantId: tenant.id, marketId, scoreVersion: "1.0", pertinence, eligibilite, attractivite, global, factors },
    });
    return global;
  }
  await upsertScore(m1.id, 94, 82, 76, { secteur: "Informatique — correspondance directe", agrement: "valide", concurrence: "modérée (4 offres attendues)" });
  await upsertScore(m7.id, 90, 70, 81, { secteur: "Développement informatique — correspondance directe", agrement: "sans objet", reservation: "PME" });
  await upsertScore(m8.id, 35, 40, 30, { secteur: "Véhicules — hors coeur de métier" });

  await db.matchResult.upsert({ where: { tenantId_marketId: { tenantId: tenant.id, marketId: m1.id } }, update: {}, create: { tenantId: tenant.id, marketId: m1.id, verdict: MatchVerdict.COMPATIBLE, reasons: { secteur: true, agrement: true, delai: "large" } } });
  await db.matchResult.upsert({ where: { tenantId_marketId: { tenantId: tenant.id, marketId: m7.id } }, update: {}, create: { tenantId: tenant.id, marketId: m7.id, verdict: MatchVerdict.COMPATIBLE, reasons: { secteur: true, reservationPme: true } } });
  await db.matchResult.upsert({ where: { tenantId_marketId: { tenantId: tenant.id, marketId: m8.id } }, update: {}, create: { tenantId: tenant.id, marketId: m8.id, verdict: MatchVerdict.A_VERIFIER, reasons: { secteur: false } } });

  await db.recommendation.create({ data: { tenantId: tenant.id, marketId: m1.id, rank: 1, reason: { texte: "Correspond exactement à votre secteur et votre agrément est valide." } } });
  await db.recommendation.create({ data: { tenantId: tenant.id, marketId: m7.id, rank: 2, reason: { texte: "Marché réservé PME dans votre secteur de développement informatique." } } });
  await db.recommendation.create({ data: { tenantId: tenant.id, marketId: m3.id, rank: 3, reason: { texte: "Marché rectifié récemment dans une zone que vous suivez." } } });

  console.log("→ Veille : watchlists & alertes");
  const wlSector = await db.watchlist.create({ data: { tenantId: tenant.id, type: WatchlistType.SECTOR, keyword: "Informatique" } });
  void wlSector;
  const wlMarket = await db.watchlist.create({ data: { tenantId: tenant.id, type: WatchlistType.MARKET } });
  await db.watchlistTarget.create({ data: { watchlistId: wlMarket.id, marketId: m3.id } });
  const wlCompany = await db.watchlist.create({ data: { tenantId: tenant.id, type: WatchlistType.COMPANY } });
  await db.watchlistTarget.create({ data: { watchlistId: wlCompany.id, companyId: compXyz.id } });

  const alert1 = await db.alert.create({ data: { tenantId: tenant.id, type: AlertType.NEW_MATCHING_MARKET, priority: AlertPriority.IMPORTANTE, title: "Nouvelle opportunité correspondante", body: `${m7.title} — compatibilité 90%`, relatedMarketId: m7.id, dedupeKey: `match:${m7.id}` } });
  const alert2 = await db.alert.create({ data: { tenantId: tenant.id, type: AlertType.DEADLINE_APPROACHING, priority: AlertPriority.CRITIQUE, title: "Échéance dans moins de 48h", body: `${m1.title} — dépôt le 09 septembre`, relatedMarketId: m1.id, dedupeKey: `deadline:${m1.id}` } });
  const alert3 = await db.alert.create({ data: { tenantId: tenant.id, type: AlertType.CORRECTION, priority: AlertPriority.NORMALE, title: "Marché rectifié", body: `${m3.title} — montant et délai modifiés`, relatedMarketId: m3.id, dedupeKey: `correction:${m3.id}:1` } });
  for (const alert of [alert1, alert2, alert3]) {
    await db.notification.create({ data: { alertId: alert.id, channel: NotificationChannel.APP, status: NotificationStatus.SENT, sentAt: new Date() } });
  }
  await db.notification.create({ data: { alertId: alert2.id, channel: NotificationChannel.EMAIL, status: NotificationStatus.SENT, sentAt: new Date() } });

  console.log("→ Assistant IA (exemple de conversation)");
  const conv = await db.aiConversation.create({ data: { tenantId: tenant.id, userId: demoUser.id, title: "Quels marchés me correspondent cette semaine ?" } });
  await db.aiMessage.create({ data: { conversationId: conv.id, role: AiRole.USER, content: "Quels marchés me correspondent cette semaine ?" } });
  const answer = await db.aiMessage.create({
    data: {
      conversationId: conv.id, role: AiRole.ASSISTANT, confidence: "élevée",
      content:
        "2 opportunités correspondent fortement à votre profil : l'acquisition de matériel informatique du Ministère de l'Éducation (score 84/100, échéance le 9 septembre) et le développement de plateforme pour la SONABEL, réservé PME (score 81/100, échéance le 20 septembre).",
    },
  });
  await db.aiSource.createMany({ data: [{ messageId: answer.id, entityType: "market", entityId: m1.id, excerpt: m1.title }, { messageId: answer.id, entityType: "market", entityId: m7.id, excerpt: m7.title }] });

  console.log("→ Qualité des données & audit");
  await db.dataQualityCheck.createMany({
    data: [
      { entityType: "Market", entityId: m1.id, field: "amountEstimatedExclTax", status: DataQualityStatus.VALIDE, confidence: 0.98, extractionMethod: "regex+ocr", validatedById: analystUser.id, validatedAt: new Date() },
      { entityType: "Market", entityId: m3.id, field: "amountCorrected", status: DataQualityStatus.INCERTAIN, confidence: 0.62, extractionMethod: "ocr" },
      { entityType: "Company", entityId: compXyz.id, field: "ifu", status: DataQualityStatus.VALIDE, confidence: 0.95, extractionMethod: "regex" },
    ],
  });
  await db.auditLog.create({ data: { tenantId: tenant.id, actorUserId: demoUser.id, action: "TENANT_CREATED", entityType: "Tenant", entityId: tenant.id, after: { name: tenant.name } } });
  await db.auditLog.create({ data: { actorUserId: analystUser.id, action: "DATA_QUALITY_VALIDATED", entityType: "Market", entityId: m1.id, after: { field: "amountEstimatedExclTax", status: "VALIDE" } } });

  console.log("→ Statistiques précalculées (échantillon)");
  await db.analyticsSnapshot.createMany({
    data: [
      { dimension: "sector", dimensionKey: "Informatique", metric: "market_count", period: "2026-08", value: 3 },
      { dimension: "sector", dimensionKey: "Informatique", metric: "total_amount", period: "2026-08", value: 103_300_000 },
      { dimension: "region", dimensionKey: "Centre", metric: "market_count", period: "2026-08", value: 6 },
      { dimension: "authority", dimensionKey: ministereEducation.name, metric: "market_count", period: "2026-08", value: 2 },
    ],
  });

  console.log("✓ Seed terminé");
  console.log(`  Utilisateur démo : demo@fasopmi.bf / Demo1234!`);
  console.log(`  Administrateur   : admin@fasopmi.bf / Admin1234!`);
  void m9;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
