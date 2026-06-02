export interface Creator {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatar: string;
  followers: number;
  totalMessages: number;
  earnings: number;
  replyRate: number;
  joinedAt: Date;
  isVerified: boolean;
  category: string;
}

export interface Message {
  id: string;
  content: string;
  isPriority: boolean;
  isAnswered: boolean;
  timestamp: Date;
  reply?: string;
  isPublished?: boolean;
}

export interface WallPost {
  id: string;
  question: string;
  answer: string;
  likes: number;
  timestamp: Date;
}

// Mock Creators
export const mockCreators: Creator[] = [
  {
    id: "creator_1",
    username: "alex_creator",
    name: "Alex Rivera",
    bio: "Digital artist & animator. Building cool stuff on the internet. Previously @Adobe, now independent.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    followers: 12400,
    totalMessages: 342,
    earnings: 1240.5,
    replyRate: 78,
    joinedAt: new Date("2023-09-12"),
    isVerified: true,
    category: "Art & Design",
  },
  {
    id: "creator_2",
    username: "jordan_tech",
    name: "Jordan Chen",
    bio: "Tech educator. Sharing knowledge about web development, system design, and career growth.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan",
    followers: 8900,
    totalMessages: 256,
    earnings: 890.25,
    replyRate: 85,
    joinedAt: new Date("2023-11-03"),
    isVerified: true,
    category: "Tech & Education",
  },
  {
    id: "creator_3",
    username: "sam_music",
    name: "Sam Taylor",
    bio: "Music producer & audio engineer. Drop your beat questions here — no gatekeeping.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sam",
    followers: 15600,
    totalMessages: 512,
    earnings: 1895.75,
    replyRate: 72,
    joinedAt: new Date("2023-07-28"),
    isVerified: false,
    category: "Music",
  },
];

// Mock Messages for Dashboard
export const mockMessages: Message[] = [
  {
    id: "msg_1",
    content:
      "Your animations are insane! How long did it take you to master them?",
    isPriority: true,
    isAnswered: true,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    reply:
      "Thanks! It took about 3 years of consistent practice. The key is breaking down complex animations into simple building blocks.",
    isPublished: true,
  },
  {
    id: "msg_2",
    content: "What software do you use for your designs?",
    isPriority: false,
    isAnswered: true,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    reply: "Primarily Figma and After Effects, with some custom tooling.",
    isPublished: true,
  },
  {
    id: "msg_3",
    content: "Can you do a collab? I love your style.",
    isPriority: true,
    isAnswered: false,
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
  },
  {
    id: "msg_4",
    content: "What inspired your latest project?",
    isPriority: false,
    isAnswered: false,
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
  {
    id: "msg_5",
    content: "How do you stay motivated with creative work?",
    isPriority: false,
    isAnswered: true,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    reply:
      "I find motivation by connecting my work to real people it helps. Community feedback is huge.",
    isPublished: true,
  },
  {
    id: "msg_6",
    content: "Do you offer commissions?",
    isPriority: true,
    isAnswered: false,
    timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000),
  },
  {
    id: "msg_7",
    content: "Your tutorial series changed my life. Thank you.",
    isPriority: false,
    isAnswered: true,
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
    reply: "This means everything to me! Keep creating, you've got talent.",
  },
  {
    id: "msg_8",
    content: "What's your favorite animation technique?",
    isPriority: false,
    isAnswered: false,
    timestamp: new Date(Date.now() - 60 * 60 * 60 * 1000),
  },
  {
    id: "msg_9",
    content: "How did you build your audience?",
    isPriority: true,
    isAnswered: true,
    timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
    reply:
      "Consistency, showing up, and genuinely engaging with the community.",
    isPublished: false,
  },
  {
    id: "msg_10",
    content: "Can you review my portfolio?",
    isPriority: false,
    isAnswered: false,
    timestamp: new Date(Date.now() - 84 * 60 * 60 * 1000),
  },
  {
    id: "msg_11",
    content: "What's next for you? Any big plans?",
    isPriority: false,
    isAnswered: true,
    timestamp: new Date(Date.now() - 96 * 60 * 60 * 1000),
    reply: "Working on something secret 🤫 Stay tuned!",
    isPublished: true,
  },
  {
    id: "msg_12",
    content: "I want to get into animation but don't know where to start.",
    isPriority: true,
    isAnswered: false,
    timestamp: new Date(Date.now() - 108 * 60 * 60 * 1000),
  },
];

// Mock Wall Posts
export const mockWallPosts: WallPost[] = [
  {
    id: "wall_1",
    question:
      "Your animations are insane! How long did it take you to master them?",
    answer:
      "Thanks! It took about 3 years of consistent practice. The key is breaking down complex animations into simple building blocks.",
    likes: 342,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "wall_2",
    question: "What software do you use for your designs?",
    answer: "Primarily Figma and After Effects, with some custom tooling.",
    likes: 289,
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "wall_3",
    question: "How do you stay motivated with creative work?",
    answer:
      "I find motivation by connecting my work to real people it helps. Community feedback is huge.",
    likes: 521,
    timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
  },
  {
    id: "wall_4",
    question: "Your tutorial series changed my life. Thank you.",
    answer: "This means everything to me! Keep creating, you've got talent.",
    likes: 698,
    timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
  },
  {
    id: "wall_5",
    question: "How did you build your audience?",
    answer:
      "Consistency, showing up, and genuinely engaging with the community.",
    likes: 456,
    timestamp: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
  },
  {
    id: "wall_6",
    question: "What's next for you? Any big plans?",
    answer: "Working on something secret 🤫 Stay tuned!",
    likes: 834,
    timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
  },
];

// Helper function to get creator by username
export function getCreatorByUsername(username: string): Creator | undefined {
  return mockCreators.find((c) => c.username === username);
}

// Helper function to get messages for a creator
export function getCreatorMessages(_creatorId: string): Message[] {
  return mockMessages;
}

// Helper function to get wall posts for a creator
export function getCreatorWallPosts(_creatorId: string): WallPost[] {
  return mockWallPosts;
}

// Dashboard stats for a creator
export function getCreatorStats(creatorId: string) {
  const creator = mockCreators.find((c) => c.id === creatorId);
  const messages = getCreatorMessages(creatorId);

  return {
    totalMessages: creator?.totalMessages || 0,
    unread: messages.filter((m) => !m.isAnswered).length,
    earnings: creator?.earnings || 0,
    replyRate: creator?.replyRate || 0,
  };
}
