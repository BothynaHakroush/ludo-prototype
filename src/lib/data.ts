import type { QLevel, Difficulty } from "./board";

export interface Question {
  id: number;
  text: string;
  options: [string, string, string, string];
  correct: 1 | 2 | 3 | 4;
  level: QLevel;
  topic: "Agile" | "MVC" | "Design Patterns" | "QA";
}

const q = (
  id: number, level: QLevel, topic: Question["topic"], text: string,
  options: [string, string, string, string], correct: 1 | 2 | 3 | 4,
): Question => ({ id, level, topic, text, options, correct });

// Mock question bank: 30 questions, 10 per level (FR-6.07).
export const SEED_QUESTIONS: Question[] = [
  q(1, "easy", "Agile", "What is a sprint in Scrum?", ["A short, fixed work period", "A long project plan", "A bug report", "A type of test"], 1),
  q(2, "easy", "Agile", "Who sets the order of the product backlog?", ["The Scrum Master", "The Product Owner", "The tester", "The client's lawyer"], 2),
  q(3, "easy", "MVC", "In MVC, which part shows data to the user?", ["Model", "Controller", "View", "Database"], 3),
  q(4, "easy", "MVC", "In MVC, which part holds the game data and rules?", ["View", "Model", "Controller", "CSS"], 2),
  q(5, "easy", "QA", "What does a unit test check?", ["The whole system", "One small part of the code", "The user's computer", "The network speed"], 2),
  q(6, "easy", "QA", "What is a bug?", ["A new feature", "A wrong behaviour of the software", "A design pattern", "A meeting"], 2),
  q(7, "easy", "Design Patterns", "Which pattern makes sure a class has only one object?", ["Observer", "Factory", "Singleton", "Adapter"], 3),
  q(8, "easy", "Agile", "What is a user story?", ["A short need written from the user's view", "A test report", "A class diagram", "A server log"], 1),
  q(9, "easy", "QA", "What does QA stand for?", ["Quick Answer", "Quality Assurance", "Question Archive", "Quality Average"], 2),
  q(10, "easy", "Agile", "What happens in a daily stand-up?", ["The team plans the whole year", "Each member shares progress and blockers", "The client tests the product", "Code is deployed"], 2),
  q(11, "medium", "MVC", "In MVC, what does the Controller do?", ["Draws the screen", "Stores files", "Handles user input and updates the Model", "Tests the code"], 3),
  q(12, "medium", "Design Patterns", "Which pattern lets the View update when the Model changes?", ["Observer", "Singleton", "Builder", "Proxy"], 1),
  q(13, "medium", "Design Patterns", "Which pattern creates objects without naming their exact class?", ["Facade", "Factory Method", "Decorator", "Iterator"], 2),
  q(14, "medium", "QA", "What is regression testing?", ["Testing old features again after a change", "Testing only new code", "Testing on paper", "Testing the hardware"], 1),
  q(15, "medium", "Agile", "What is the goal of a sprint retrospective?", ["To demo the product", "To improve how the team works", "To write the SRS", "To fix all bugs"], 2),
  q(16, "medium", "QA", "What is the difference between verification and validation?", ["They are the same", "Verification: built right; Validation: right product", "Verification is only for UI", "Validation is done before coding only"], 2),
  q(17, "medium", "Agile", "What is velocity in Scrum?", ["Speed of the computer", "Work the team finishes in a sprint", "Number of bugs", "Number of meetings"], 2),
  q(18, "medium", "Design Patterns", "Which pattern gives a simple interface to a complex subsystem?", ["Facade", "Observer", "State", "Composite"], 1),
  q(19, "medium", "MVC", "Why do we separate Model and View?", ["To make the app slower", "So we can change the UI without changing logic", "Because Java needs it", "To save disk space"], 2),
  q(20, "medium", "QA", "What is an acceptance test?", ["A test the developer runs on one method", "A test that checks the product meets user needs", "A speed test", "A security scan"], 2),
  q(21, "hard", "Design Patterns", "Which pattern fits changing a piece's behaviour by its state (castle, board, home)?", ["State", "Adapter", "Prototype", "Bridge"], 1),
  q(22, "hard", "Design Patterns", "Which pattern lets you add features to an object without changing its class?", ["Decorator", "Singleton", "Factory", "Memento"], 1),
  q(23, "hard", "QA", "In black-box testing, what do testers use to design tests?", ["The source code", "The requirements and inputs/outputs", "The compiler", "The database schema only"], 2),
  q(24, "hard", "QA", "Boundary value analysis for names of 1–15 characters tests which lengths?", ["Only 8", "0, 1, 15, 16", "1 and 100", "Only 15"], 2),
  q(25, "hard", "Agile", "What is the Definition of Done?", ["A list of rules a task must meet to be finished", "The final exam", "The last sprint", "A bug list"], 1),
  q(26, "hard", "MVC", "Where should the rule 'a piece enters only on a 6' live in MVC?", ["View", "Model", "CSS file", "Main method only"], 2),
  q(27, "hard", "Design Patterns", "Which pattern lets the dice type (Normal, Boost, UltraBoost) be swapped at runtime?", ["Strategy", "Singleton", "Observer", "Facade"], 1),
  q(28, "hard", "QA", "What does code coverage measure?", ["How fast code runs", "How much code is run by tests", "How many users the app has", "How many classes exist"], 2),
  q(29, "hard", "Agile", "What is technical debt?", ["Money owed to the client", "Extra future work caused by quick, poor solutions", "A licence cost", "Unpaid salaries"], 2),
  q(30, "hard", "Design Patterns", "Which pattern saves and restores an object's state (for example, undo)?", ["Memento", "Adapter", "Composite", "Proxy"], 1),
];

export interface HistoryRecord {
  gameID: number;
  difficulty: Difficulty;
  timestamp: string; // DD/MM/YYYY;HH:MM:SS
  places: [string, string, string, string];
  duration: string; // HH:MM:SS
}

// Mock records that follow the course CSV schema (game_history.csv).
export const SEED_HISTORY: HistoryRecord[] = [
  { gameID: 1, difficulty: "hard", timestamp: "19/10/2026;12:01:00", places: ["Mor", "Noy", "Safa", "Muhammed"], duration: "01:05:04" },
  { gameID: 2, difficulty: "easy", timestamp: "21/10/2026;18:40:12", places: ["Nadin", "David", "", ""], duration: "00:22:31" },
  { gameID: 3, difficulty: "medium", timestamp: "24/10/2026;20:15:47", places: ["Bothyna", "Mahmoud", "Nadin", ""], duration: "00:48:09" },
  { gameID: 4, difficulty: "medium", timestamp: "27/10/2026;13:02:55", places: ["David", "Mahmoud", "Bothyna", "Nadin"], duration: "00:57:40" },
  { gameID: 5, difficulty: "easy", timestamp: "30/10/2026;10:30:05", places: ["Mahmoud", "Nadin", "", ""], duration: "00:19:58" },
];

export const CSV_HEADER =
  "gameID,difficulty,timestamp(DD/MM/YYYY; HH:MM:SS),1st_place_name,2nd_place_name,3rd_place_name,4rd_place_name,game_duration(HH:MM:SS)";

export interface AuditEntry {
  at: string;
  admin: string;
  action: "Added" | "Edited" | "Deleted";
  questionId: number;
  detail: string;
}

// Centralised game-rule parameters (MNT-2).
export const QUESTION_STEPS: Record<QLevel, number> = { easy: 1, medium: 2, hard: 3 };
export const SURPRISE_TABLE = [
  { id: "home", p: 10, label: "Fly straight to Final Home" },
  { id: "opponent", p: 10, label: "Push an opponent back by half a die" },
  { id: "castle", p: 10, label: "Go back to your castle" },
  { id: "back3", p: 30, label: "Move 3 steps back" },
  { id: "skip", p: 30, label: "Skip your next turn" },
  { id: "ultra", p: 10, label: "Extra turn with UltraBoost" },
] as const;
export type SurpriseId = (typeof SURPRISE_TABLE)[number]["id"];

export const ADMIN_DEMO_PASSWORD = "Spider2026";
