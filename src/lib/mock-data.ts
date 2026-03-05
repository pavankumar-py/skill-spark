export interface Assessment {
  id: string;
  title: string;
  role: string;
  techStack: string[];
  experienceLevel: string;
  aptitudeCount: number;
  codingCount: number;
  difficulty: string;
  duration: number;
  antiCheat: boolean;
  createdAt: string;
  status: "active" | "closed";
  candidateCount: number;
  link: string;
}

export interface CandidateResult {
  id: string;
  name: string;
  email: string;
  phone: string;
  assessmentId: string;
  assessmentName: string;
  aptitudeScore: number;
  codingScore: number;
  totalScore: number;
  status: "completed" | "in-progress" | "not-started";
  completedAt: string;
  aiSummary: string;
}

export interface AptitudeQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface CodingQuestion {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  topic: string;
  testCases: { input: string; expectedOutput: string }[];
  starterCode: { python: string; javascript: string };
}

export const mockAssessments: Assessment[] = [
  {
    id: "1",
    title: "Senior Frontend Engineer Assessment",
    role: "Frontend",
    techStack: ["React", "TypeScript", "CSS"],
    experienceLevel: "3-5 years",
    aptitudeCount: 10,
    codingCount: 3,
    difficulty: "Medium",
    duration: 90,
    antiCheat: true,
    createdAt: "2026-03-01",
    status: "active",
    candidateCount: 24,
    link: "/assessment/1",
  },
  {
    id: "2",
    title: "Backend Developer Challenge",
    role: "Backend",
    techStack: ["Node.js", "Python", "SQL"],
    experienceLevel: "1-3 years",
    aptitudeCount: 8,
    codingCount: 2,
    difficulty: "Easy",
    duration: 60,
    antiCheat: true,
    createdAt: "2026-02-20",
    status: "active",
    candidateCount: 18,
    link: "/assessment/2",
  },
  {
    id: "3",
    title: "Fullstack Engineer Test",
    role: "Fullstack",
    techStack: ["React", "Node.js", "PostgreSQL"],
    experienceLevel: "5+ years",
    aptitudeCount: 15,
    codingCount: 4,
    difficulty: "Hard",
    duration: 120,
    antiCheat: true,
    createdAt: "2026-02-10",
    status: "closed",
    candidateCount: 32,
    link: "/assessment/3",
  },
  {
    id: "4",
    title: "Data Engineer Screening",
    role: "Data",
    techStack: ["Python", "SQL", "Spark"],
    experienceLevel: "3-5 years",
    aptitudeCount: 10,
    codingCount: 3,
    difficulty: "Medium",
    duration: 90,
    antiCheat: false,
    createdAt: "2026-01-15",
    status: "closed",
    candidateCount: 12,
    link: "/assessment/4",
  },
];

export const mockCandidates: CandidateResult[] = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com", phone: "+1234567890", assessmentId: "1", assessmentName: "Senior Frontend Engineer Assessment", aptitudeScore: 85, codingScore: 92, totalScore: 89, status: "completed", completedAt: "2026-03-02", aiSummary: "Strong understanding of React patterns and TypeScript. Excellent problem-solving skills with clean code." },
  { id: "2", name: "Bob Smith", email: "bob@example.com", phone: "+1234567891", assessmentId: "1", assessmentName: "Senior Frontend Engineer Assessment", aptitudeScore: 72, codingScore: 68, totalScore: 70, status: "completed", completedAt: "2026-03-02", aiSummary: "Good foundational knowledge. Needs improvement in advanced CSS and state management." },
  { id: "3", name: "Carol Davis", email: "carol@example.com", phone: "+1234567892", assessmentId: "2", assessmentName: "Backend Developer Challenge", aptitudeScore: 90, codingScore: 95, totalScore: 93, status: "completed", completedAt: "2026-02-22", aiSummary: "Exceptional backend skills. Strong in algorithms and system design thinking." },
  { id: "4", name: "David Lee", email: "david@example.com", phone: "+1234567893", assessmentId: "1", assessmentName: "Senior Frontend Engineer Assessment", aptitudeScore: 60, codingScore: 55, totalScore: 57, status: "completed", completedAt: "2026-03-03", aiSummary: "Basic understanding of frontend concepts. Struggles with complex data structures." },
  { id: "5", name: "Eva Martinez", email: "eva@example.com", phone: "+1234567894", assessmentId: "3", assessmentName: "Fullstack Engineer Test", aptitudeScore: 88, codingScore: 82, totalScore: 85, status: "completed", completedAt: "2026-02-12", aiSummary: "Well-rounded fullstack knowledge. Strong in both frontend and backend domains." },
  { id: "6", name: "Frank Wilson", email: "frank@example.com", phone: "+1234567895", assessmentId: "2", assessmentName: "Backend Developer Challenge", aptitudeScore: 78, codingScore: 80, totalScore: 79, status: "completed", completedAt: "2026-02-23", aiSummary: "Solid backend fundamentals with good coding practices." },
  { id: "7", name: "Grace Chen", email: "grace@example.com", phone: "+1234567896", assessmentId: "1", assessmentName: "Senior Frontend Engineer Assessment", aptitudeScore: 95, codingScore: 98, totalScore: 97, status: "completed", completedAt: "2026-03-01", aiSummary: "Outstanding candidate. Deep expertise in React, performance optimization, and clean architecture." },
  { id: "8", name: "Henry Brown", email: "henry@example.com", phone: "+1234567897", assessmentId: "3", assessmentName: "Fullstack Engineer Test", aptitudeScore: 65, codingScore: 70, totalScore: 68, status: "completed", completedAt: "2026-02-13", aiSummary: "Moderate skills across the stack. Would benefit from deeper focus on one area." },
];

export const mockAptitudeQuestions: AptitudeQuestion[] = [
  { id: "1", question: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], correctAnswer: 1 },
  { id: "2", question: "Which data structure uses FIFO ordering?", options: ["Stack", "Queue", "Tree", "Graph"], correctAnswer: 1 },
  { id: "3", question: "What does REST stand for?", options: ["Remote Execution of Stored Tasks", "Representational State Transfer", "Real-time Event Streaming Technology", "Resource Efficient Server Technology"], correctAnswer: 1 },
  { id: "4", question: "Which HTTP method is idempotent?", options: ["POST", "PATCH", "PUT", "None of the above"], correctAnswer: 2 },
  { id: "5", question: "What is the output of typeof null in JavaScript?", options: ["null", "undefined", "object", "boolean"], correctAnswer: 2 },
];

export const mockCodingQuestions: CodingQuestion[] = [
  {
    id: "1",
    title: "Two Sum",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
    difficulty: "Easy",
    topic: "Arrays",
    testCases: [
      { input: "nums = [2,7,11,15], target = 9", expectedOutput: "[0, 1]" },
      { input: "nums = [3,2,4], target = 6", expectedOutput: "[1, 2]" },
    ],
    starterCode: {
      python: "def two_sum(nums, target):\n    # Your code here\n    pass",
      javascript: "function twoSum(nums, target) {\n    // Your code here\n}",
    },
  },
  {
    id: "2",
    title: "Reverse String",
    description: "Write a function that reverses a string. The input string is given as an array of characters.\n\nDo not allocate extra space for another array. You must do this by modifying the input array in-place.",
    difficulty: "Easy",
    topic: "Strings",
    testCases: [
      { input: '["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]' },
      { input: '["H","a","n","n","a","h"]', expectedOutput: '["h","a","n","n","a","H"]' },
    ],
    starterCode: {
      python: "def reverse_string(s):\n    # Your code here\n    pass",
      javascript: "function reverseString(s) {\n    // Your code here\n}",
    },
  },
];

export const scoreDistributionData = [
  { range: "0-20", count: 2 },
  { range: "21-40", count: 5 },
  { range: "41-60", count: 12 },
  { range: "61-80", count: 18 },
  { range: "81-100", count: 8 },
];

export const assessmentsOverTimeData = [
  { month: "Oct", count: 3 },
  { month: "Nov", count: 5 },
  { month: "Dec", count: 4 },
  { month: "Jan", count: 7 },
  { month: "Feb", count: 6 },
  { month: "Mar", count: 4 },
];

export const participationData = [
  { month: "Oct", candidates: 15 },
  { month: "Nov", candidates: 28 },
  { month: "Dec", candidates: 22 },
  { month: "Jan", candidates: 42 },
  { month: "Feb", candidates: 50 },
  { month: "Mar", candidates: 24 },
];
