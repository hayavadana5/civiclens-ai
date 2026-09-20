import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/db";
import User from "../models/User";
import Issue from "../models/Issue";
import IssueCluster from "../models/IssueCluster";
import Resolution from "../models/Resolution";
import ActivityLog from "../models/ActivityLog";
import { calculatePriority } from "../utils/priorityEngine";

async function clearCollections() {
  await Promise.all([
    User.deleteMany({}),
    Issue.deleteMany({}),
    IssueCluster.deleteMany({}),
    Resolution.deleteMany({}),
    ActivityLog.deleteMany({}),
  ]);
  console.log("[SEED] Cleared existing collections.");
}

async function seedUsers() {
  const users = await User.insertMany([
    { name: "Ananya Rao", email: "ananya.rao@example.com", role: "CITIZEN" },
    { name: "Vikram Nair", email: "vikram.nair@example.com", role: "CITIZEN" },
    { name: "Priya Sharma", email: "priya.sharma@example.com", role: "CITIZEN" },
    { name: "Rohit Mehta", email: "rohit.mehta@example.com", role: "CITIZEN" },
    { name: "Sanjay Gupta", email: "sanjay.gupta@example.com", role: "CITIZEN" },
    { name: "Municipal Roads Dept", email: "roads.dept@civiclens.gov", role: "AUTHORITY" },
    { name: "Sanitation Dept", email: "sanitation.dept@civiclens.gov", role: "AUTHORITY" },
    { name: "Water Board", email: "water.board@civiclens.gov", role: "AUTHORITY" },
  ]);
  console.log(`[SEED] Created ${users.length} users.`);
  return users;
}

interface SeedIssueInput {
  title: string;
  description: string;
  category: any;
  location: string;
  latitude: number;
  longitude: number;
  severity: any;
  urgencyScore: number;
  safetyRisk: any;
  affectedPeopleEstimate: number;
  department: string;
  recommendedAction: string;
  keywords: string[];
  status: any;
  daysAgo: number;
  reporterId?: mongoose.Types.ObjectId;
}

function daysAgoDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function seedIssues(users: any[]) {
  const citizens = users.filter((u) => u.role === "CITIZEN");

  const rawIssues: SeedIssueInput[] = [
    {
      title: "Large pothole near MG Road bus stop",
      description: "There is a large, deep pothole right next to the bus stop on MG Road. Two-wheelers keep swerving dangerously to avoid it, especially at night.",
      category: "Roads",
      location: "MG Road, near Bus Stop 4",
      latitude: 12.9756, longitude: 77.6068,
      severity: "HIGH", urgencyScore: 87, safetyRisk: "HIGH", affectedPeopleEstimate: 40,
      department: "Road Maintenance", recommendedAction: "Immediate inspection and temporary barricading",
      keywords: ["pothole", "road", "bus", "stop", "dangerous"],
      status: "REPORTED", daysAgo: 1,
    },
    {
      title: "Deep pothole causing accidents on MG Road",
      description: "Another pothole has formed about 20 meters from the MG Road bus stop. A scooter rider fell here yesterday evening.",
      category: "Roads",
      location: "MG Road, near Bus Stop 4",
      latitude: 12.9758, longitude: 77.6070,
      severity: "HIGH", urgencyScore: 90, safetyRisk: "HIGH", affectedPeopleEstimate: 45,
      department: "Road Maintenance", recommendedAction: "Immediate inspection and temporary barricading",
      keywords: ["pothole", "road", "bus", "accident", "scooter"],
      status: "REPORTED", daysAgo: 1,
    },
    {
      title: "Cracked road surface on Residency Road",
      description: "The entire stretch of Residency Road near the flyover has developed long cracks and is breaking apart after the recent rains.",
      category: "Roads",
      location: "Residency Road, near Flyover",
      latitude: 12.9718, longitude: 77.6094,
      severity: "MEDIUM", urgencyScore: 60, safetyRisk: "MEDIUM", affectedPeopleEstimate: 200,
      department: "Road Maintenance", recommendedAction: "Resurface road section within 2 weeks",
      keywords: ["road", "crack", "flyover", "rain"],
      status: "VERIFIED", daysAgo: 6,
    },
    {
      title: "Garbage pile not collected for a week",
      description: "Household garbage has been piling up at the corner of 5th Cross for over a week now. It is starting to smell and attracting stray animals.",
      category: "Waste Management",
      location: "5th Cross, Indiranagar",
      latitude: 12.9719, longitude: 77.6412,
      severity: "MEDIUM", urgencyScore: 55, safetyRisk: "MEDIUM", affectedPeopleEstimate: 60,
      department: "Sanitation Department", recommendedAction: "Schedule waste collection and clean-up crew within 48 hours",
      keywords: ["garbage", "waste", "smell", "collection"],
      status: "ASSIGNED", daysAgo: 4,
    },
    {
      title: "Illegal dumping behind community park",
      description: "Someone is illegally dumping construction waste and garbage behind the community park every night. It's becoming a health hazard for kids playing nearby.",
      category: "Waste Management",
      location: "Community Park, HSR Layout",
      latitude: 12.9121, longitude: 77.6446,
      severity: "HIGH", urgencyScore: 65, safetyRisk: "MEDIUM", affectedPeopleEstimate: 150,
      department: "Sanitation Department", recommendedAction: "Install CCTV and increase patrol; clear dumped waste",
      keywords: ["illegal", "dumping", "construction", "waste", "park"],
      status: "REPORTED", daysAgo: 2,
    },
    {
      title: "Overflowing garbage bin near market",
      description: "The public garbage bin near the vegetable market is overflowing and waste is spilling onto the street, blocking pedestrian movement.",
      category: "Waste Management",
      location: "Vegetable Market, Jayanagar",
      latitude: 12.9308, longitude: 77.5838,
      severity: "MEDIUM", urgencyScore: 50, safetyRisk: "LOW", affectedPeopleEstimate: 80,
      department: "Sanitation Department", recommendedAction: "Empty bin and increase collection frequency",
      keywords: ["garbage", "bin", "overflow", "market"],
      status: "IN_PROGRESS", daysAgo: 3,
    },
    {
      title: "Major water pipe leak flooding street",
      description: "A major water pipeline has burst near the junction and is flooding the street. Water is being wasted continuously since this morning.",
      category: "Water",
      location: "Junction Road, Koramangala",
      latitude: 12.9352, longitude: 77.6245,
      severity: "HIGH", urgencyScore: 85, safetyRisk: "MEDIUM", affectedPeopleEstimate: 300,
      department: "Water Supply Department", recommendedAction: "Dispatch water department technician to inspect and repair the leak",
      keywords: ["water", "leak", "pipeline", "flooding"],
      status: "REPORTED", daysAgo: 1,
    },
    {
      title: "Drinking water pipe leaking near school",
      description: "There's a slow but constant water leak from an underground pipe right outside the primary school gate. Water is pooling on the road.",
      category: "Water",
      location: "Near Govt Primary School, Malleshwaram",
      latitude: 13.0035, longitude: 77.5645,
      severity: "MEDIUM", urgencyScore: 58, safetyRisk: "MEDIUM", affectedPeopleEstimate: 120,
      department: "Water Supply Department", recommendedAction: "Repair underground pipeline joint",
      keywords: ["water", "leak", "pipe", "school"],
      status: "VERIFIED", daysAgo: 5,
    },
    {
      title: "Streetlight not working for two weeks",
      description: "The streetlight at the end of our lane has not worked for two weeks now. The area is completely dark at night, which feels unsafe for women walking home.",
      category: "Street Lighting",
      location: "8th Main, BTM Layout",
      latitude: 12.9166, longitude: 77.6101,
      severity: "MEDIUM", urgencyScore: 62, safetyRisk: "HIGH", affectedPeopleEstimate: 35,
      department: "Electrical Maintenance", recommendedAction: "Send electrical crew to repair or replace the faulty streetlight",
      keywords: ["streetlight", "dark", "unsafe", "night"],
      status: "REPORTED", daysAgo: 14,
    },
    {
      title: "Multiple streetlights out on park road",
      description: "Three consecutive streetlights along the road bordering Cubbon Park are not working, making evening walks and jogging unsafe.",
      category: "Street Lighting",
      location: "Cubbon Park Road",
      latitude: 12.9763, longitude: 77.5929,
      severity: "MEDIUM", urgencyScore: 55, safetyRisk: "MEDIUM", affectedPeopleEstimate: 90,
      department: "Electrical Maintenance", recommendedAction: "Inspect and replace faulty streetlight units",
      keywords: ["streetlight", "dark", "park", "unsafe"],
      status: "ASSIGNED", daysAgo: 7,
    },
    {
      title: "Open manhole without cover — serious accident risk",
      description: "An open manhole near the school crossing has been without a cover for days. This is extremely dangerous, especially for children and at night when it's hard to see.",
      category: "Public Safety",
      location: "School Crossing, Basavanagudi",
      latitude: 12.9422, longitude: 77.5760,
      severity: "CRITICAL", urgencyScore: 96, safetyRisk: "HIGH", affectedPeopleEstimate: 250,
      department: "Public Safety Department", recommendedAction: "Urgent on-site inspection and immediate hazard containment required",
      keywords: ["manhole", "danger", "children", "accident", "school"],
      status: "REPORTED", daysAgo: 0,
    },
    {
      title: "Exposed electrical wiring near bus stand",
      description: "Loose electrical wires are hanging low near the bus stand, and one already caused a minor shock to a commuter yesterday.",
      category: "Public Safety",
      location: "Central Bus Stand",
      latitude: 12.9774, longitude: 77.5709,
      severity: "CRITICAL", urgencyScore: 93, safetyRisk: "HIGH", affectedPeopleEstimate: 400,
      department: "Public Safety Department", recommendedAction: "Immediate power isolation and rewiring by certified electrician",
      keywords: ["wire", "shock", "danger", "electrical", "bus"],
      status: "VERIFIED", daysAgo: 2,
    },
    {
      title: "Blocked drainage causing waterlogging",
      description: "The main drainage channel along Church Street is completely blocked with debris, causing waterlogging every time it rains even slightly.",
      category: "Drainage",
      location: "Church Street",
      latitude: 12.9758, longitude: 77.6045,
      severity: "HIGH", urgencyScore: 70, safetyRisk: "MEDIUM", affectedPeopleEstimate: 180,
      department: "Drainage & Flood Control", recommendedAction: "Clear blocked drainage and monitor for flooding risk",
      keywords: ["drain", "drainage", "flood", "waterlog", "block"],
      status: "REPORTED", daysAgo: 3,
    },
    {
      title: "Severe flooding on residential street after rain",
      description: "Our entire street floods within minutes of any rainfall because the drainage system can't handle the water. Cars have gotten stuck multiple times.",
      category: "Drainage",
      location: "Lakeview Layout",
      latitude: 12.9089, longitude: 77.5831,
      severity: "HIGH", urgencyScore: 75, safetyRisk: "MEDIUM", affectedPeopleEstimate: 220,
      department: "Drainage & Flood Control", recommendedAction: "Upgrade drainage capacity and clear blockages upstream",
      keywords: ["flood", "drainage", "rain", "waterlog"],
      status: "IN_PROGRESS", daysAgo: 10,
    },
    {
      title: "Damaged and confusing road sign at intersection",
      description: "The road sign at the busy four-way intersection is bent and unreadable, causing confusion and near-miss collisions during peak hours.",
      category: "Roads",
      location: "Four-way Intersection, Whitefield",
      latitude: 12.9698, longitude: 77.7500,
      severity: "MEDIUM", urgencyScore: 48, safetyRisk: "MEDIUM", affectedPeopleEstimate: 300,
      department: "Road Maintenance", recommendedAction: "Replace damaged signage",
      keywords: ["road", "sign", "intersection", "confusion"],
      status: "REPORTED", daysAgo: 5,
    },
    {
      title: "Unsafe pedestrian crossing near school",
      description: "There is no zebra crossing or signal near the school gate, and children have to dodge fast traffic to cross the road every morning.",
      category: "Public Safety",
      location: "School Gate, Frazer Town",
      latitude: 12.9967, longitude: 77.6120,
      severity: "HIGH", urgencyScore: 80, safetyRisk: "HIGH", affectedPeopleEstimate: 500,
      department: "Public Safety Department", recommendedAction: "Install zebra crossing and traffic signal near school",
      keywords: ["pedestrian", "crossing", "school", "traffic", "children"],
      status: "RESOLVED", daysAgo: 20,
    },
    {
      title: "Bus shelter roof collapsed after storm",
      description: "The roof of the bus shelter collapsed during last week's storm and hasn't been repaired, leaving commuters exposed to sun and rain.",
      category: "Public Transport",
      location: "Bus Stop, Malleshwaram Circle",
      latitude: 13.0068, longitude: 77.5686,
      severity: "MEDIUM", urgencyScore: 45, safetyRisk: "MEDIUM", affectedPeopleEstimate: 100,
      department: "Transport Authority", recommendedAction: "Inspect and repair public transport infrastructure",
      keywords: ["bus", "stop", "shelter", "collapse", "storm"],
      status: "ASSIGNED", daysAgo: 8,
    },
    {
      title: "Foul smell and pollution from nearby factory",
      description: "A persistent chemical smell from a nearby small factory is affecting residents' breathing and quality of life, especially in the evenings.",
      category: "Environment",
      location: "Industrial Area, Peenya",
      latitude: 13.0280, longitude: 77.5200,
      severity: "MEDIUM", urgencyScore: 52, safetyRisk: "MEDIUM", affectedPeopleEstimate: 600,
      department: "Environment Department", recommendedAction: "Assess environmental impact and take corrective measures",
      keywords: ["pollution", "smell", "factory", "chemical"],
      status: "REPORTED", daysAgo: 4,
    },
    {
      title: "Old streetlight pole sparking intermittently",
      description: "An old streetlight pole near the park has exposed wiring at the base and sparks intermittently, especially when it rains.",
      category: "Electricity",
      location: "Park Entrance, Rajajinagar",
      latitude: 12.9991, longitude: 77.5554,
      severity: "HIGH", urgencyScore: 82, safetyRisk: "HIGH", affectedPeopleEstimate: 70,
      department: "Electricity Board", recommendedAction: "Dispatch electrical safety team to inspect the reported hazard",
      keywords: ["electricity", "spark", "wire", "danger", "pole"],
      status: "VERIFIED", daysAgo: 3,
    },
    {
      title: "Water tanker overcharging residents",
      description: "This is more of an administrative issue — the water supply has been irregular for two weeks and residents are being overcharged by private tankers.",
      category: "Water",
      location: "Sector 4, Electronic City",
      latitude: 12.8452, longitude: 77.6602,
      severity: "LOW", urgencyScore: 30, safetyRisk: "LOW", affectedPeopleEstimate: 250,
      department: "Water Supply Department", recommendedAction: "Investigate supply irregularity and regulate tanker pricing",
      keywords: ["water", "supply", "tanker", "irregular"],
      status: "REPORTED", daysAgo: 9,
    },
  ];

  const createdIssues: any[] = [];
  for (let i = 0; i < rawIssues.length; i++) {
    const raw = rawIssues[i];
    const createdAt = daysAgoDate(raw.daysAgo);
    const reporter = citizens[i % citizens.length];

    const priority = calculatePriority({
      severity: raw.severity,
      urgencyScore: raw.urgencyScore,
      safetyRisk: raw.safetyRisk,
      affectedPeopleEstimate: raw.affectedPeopleEstimate,
      similarReportsCount: 0,
      createdAt,
    });

    const issue = await Issue.create({
      title: raw.title,
      description: raw.description,
      category: raw.category,
      location: raw.location,
      latitude: raw.latitude,
      longitude: raw.longitude,
      severity: raw.severity,
      urgencyScore: raw.urgencyScore,
      priorityScore: priority.priorityScore,
      priorityLevel: priority.priorityLevel,
      safetyRisk: raw.safetyRisk,
      affectedPeopleEstimate: raw.affectedPeopleEstimate,
      department: raw.department,
      recommendedAction: raw.recommendedAction,
      keywords: raw.keywords,
      reasoning: `Classified as "${raw.category}" based on report content and location context.`,
      confidence: 80 + (i % 15),
      status: raw.status,
      reporterId: reporter._id,
      createdAt,
      updatedAt: createdAt,
    });

    createdIssues.push(issue);
  }

  console.log(`[SEED] Created ${createdIssues.length} issues.`);
  return createdIssues;
}

async function seedClusters(issues: any[]) {
  // Cluster 1: MG Road potholes (issues 0 and 1)
  const cluster1 = await IssueCluster.create({
    title: "Roads issues near MG Road, near Bus Stop 4",
    category: "Roads",
    location: "MG Road, near Bus Stop 4",
    reportIds: [issues[0]._id, issues[1]._id],
    reportCount: 2,
    priorityScore: Math.max(issues[0].priorityScore, issues[1].priorityScore),
    status: "OPEN",
  });
  await Issue.updateMany({ _id: { $in: [issues[0]._id, issues[1]._id] } }, { clusterId: cluster1._id });

  // Cluster 2: Streetlight outages (issues 8 and 9)
  const cluster2 = await IssueCluster.create({
    title: "Street Lighting issues across BTM Layout & Cubbon Park",
    category: "Street Lighting",
    location: "BTM Layout / Cubbon Park Road",
    reportIds: [issues[8]._id, issues[9]._id],
    reportCount: 2,
    priorityScore: Math.max(issues[8].priorityScore, issues[9].priorityScore),
    status: "OPEN",
  });
  await Issue.updateMany({ _id: { $in: [issues[8]._id, issues[9]._id] } }, { clusterId: cluster2._id });

  // Cluster 3: Drainage/flooding (issues 12 and 13)
  const cluster3 = await IssueCluster.create({
    title: "Drainage issues — Church Street & Lakeview Layout",
    category: "Drainage",
    location: "Church Street / Lakeview Layout",
    reportIds: [issues[12]._id, issues[13]._id],
    reportCount: 2,
    priorityScore: Math.max(issues[12].priorityScore, issues[13].priorityScore),
    status: "IN_PROGRESS",
  });
  await Issue.updateMany({ _id: { $in: [issues[12]._id, issues[13]._id] } }, { clusterId: cluster3._id });

  console.log("[SEED] Created 3 issue clusters.");
  return [cluster1, cluster2, cluster3];
}

async function seedResolutionsAndLogs(issues: any[], users: any[]) {
  const authority = users.find((u) => u.role === "AUTHORITY");

  // Find the resolved issue (pedestrian crossing) and add a Resolution record
  const resolvedIssue = issues.find((i) => i.status === "RESOLVED");
  if (resolvedIssue) {
    await Resolution.create({
      issueId: resolvedIssue._id,
      notes: "Installed a zebra crossing with reflective paint and a pedestrian signal. Traffic police were also assigned during school hours.",
      afterImage: null,
      verified: true,
      confidence: 91,
      verificationReason: "After-image and detailed resolution notes confirm the fix was implemented correctly.",
      resolvedBy: authority?._id,
      createdAt: daysAgoDate(2),
    });
  }

  // Activity logs for every issue: creation + a status-appropriate follow-up
  for (const issue of issues) {
    await ActivityLog.create({
      issueId: issue._id,
      action: "ISSUE_CREATED",
      description: `Issue reported and analyzed. Priority: ${issue.priorityLevel} (${issue.priorityScore}).`,
      createdAt: issue.createdAt,
    });

    if (issue.status === "VERIFIED" || issue.status === "ASSIGNED" || issue.status === "IN_PROGRESS" || issue.status === "RESOLVED") {
      await ActivityLog.create({
        issueId: issue._id,
        action: "ISSUE_VERIFIED",
        description: "Issue verified by municipal authority after field inspection.",
        performedBy: authority?._id,
        createdAt: new Date(issue.createdAt.getTime() + 1000 * 60 * 60 * 6),
      });
    }

    if (issue.status === "ASSIGNED" || issue.status === "IN_PROGRESS" || issue.status === "RESOLVED") {
      await ActivityLog.create({
        issueId: issue._id,
        action: "ISSUE_ASSIGNED",
        description: `Issue assigned to ${issue.department}.`,
        performedBy: authority?._id,
        createdAt: new Date(issue.createdAt.getTime() + 1000 * 60 * 60 * 12),
      });
    }

    if (issue.status === "RESOLVED") {
      await ActivityLog.create({
        issueId: issue._id,
        action: "ISSUE_RESOLVED",
        description: "Issue marked resolved after verification of on-site fix.",
        performedBy: authority?._id,
        createdAt: new Date(issue.createdAt.getTime() + 1000 * 60 * 60 * 24 * 2),
      });
    }
  }

  console.log("[SEED] Created resolution record and activity logs.");
}

async function run() {
  await connectDB();
  console.log("[SEED] Starting database seed...");

  await clearCollections();
  const users = await seedUsers();
  const issues = await seedIssues(users);
  await seedClusters(issues);
  await seedResolutionsAndLogs(issues, users);

  console.log("[SEED] Seed complete!");
  console.log(`[SEED] Summary: ${users.length} users, ${issues.length} issues, 3 clusters.`);

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error("[SEED] Seed failed:", err);
  process.exit(1);
});
