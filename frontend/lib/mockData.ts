import { Tweet, User, Comment } from './types';

export const mockUser: User = {
  id: '1',
  name: 'John Doe',
  username: 'johndoe',
  profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
};

export const mockReplies: Comment[] = [
  {
    id: '101',
    content: 'This is a nested reply to the comment!',
    createdAt: '2023-06-15T10:30:00Z',
    author: {
      id: '2',
      name: 'Jane Smith',
      username: 'janesmith',
      profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane'
    },
    likes: 2,
    replies: []
  },
  {
    id: '102',
    content: 'Another nested reply with more context.',
    createdAt: '2023-06-15T11:45:00Z',
    author: {
      id: '3',
      name: 'Bob Johnson',
      username: 'bobjohnson',
      profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'
    },
    likes: 5,
    replies: []
  },
  // New nested replies
  {
    id: '103',
    content: 'Adding more detail to the discussion here.',
    createdAt: '2023-06-15T12:15:00Z',
    author: {
      id: '5',
      name: 'Charlie Brown',
      username: 'charlieb',
      profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie'
    },
    likes: 3,
    replies: []
  },
  {
    id: '104',
    content: 'Great points above, but what about scalability?',
    createdAt: '2023-06-15T12:45:00Z',
    author: {
      id: '6',
      name: 'Diana Prince',
      username: 'dianap',
      profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana'
    },
    likes: 7,
    replies: []
  }
];

export const mockComments: Comment[] = [
  {
    id: '1',
    content: 'This is a great post! I really enjoyed reading it.',
    createdAt: '2023-06-15T09:30:00Z',
    author: {
      id: '2',
      name: 'Jane Smith',
      username: 'janesmith',
      profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane'
    },
    likes: 12,
    replies: mockReplies
  },
  {
    id: '2',
    content: 'I have a different perspective on this topic...',
    createdAt: '2023-06-15T10:15:00Z',
    author: {
      id: '3',
      name: 'Bob Johnson',
      username: 'bobjohnson',
      profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'
    },
    likes: 8,
    replies: []
  },
  {
    id: '3',
    content: 'Thanks for sharing this information!',
    createdAt: '2023-06-15T11:00:00Z',
    author: {
      id: '4',
      name: 'Alice Williams',
      username: 'alicew',
      profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice'
    },
    likes: 15,
    replies: []
  },
  // Additional comments with nested replies
  {
    id: '4',
    content: 'Curious to know how you handled performance optimizations.',
    createdAt: '2023-06-15T12:30:00Z',
    author: {
      id: '5',
      name: 'Charlie Brown',
      username: 'charlieb',
      profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie'
    },
    likes: 6,
    replies: [
      {
        id: '201',
        content: 'Performance was definitely a challenge, but we used caching heavily.',
        createdAt: '2023-06-15T12:40:00Z',
        author: {
          id: '1',
          name: 'John Doe',
          username: 'johndoe',
          profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
        },
        likes: 2,
        replies: []
      },
      {
        id: '202',
        content: 'Did you consider server-side rendering for this part?',
        createdAt: '2023-06-15T12:50:00Z',
        author: {
          id: '6',
          name: 'Diana Prince',
          username: 'dianap',
          profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana'
        },
        likes: 4,
        replies: []
      }
    ]
  },
  {
    id: '5',
    content: 'I love the UI design choices you made. Very user-friendly!',
    createdAt: '2023-06-15T13:00:00Z',
    author: {
      id: '7',
      name: 'Edward Yang',
      username: 'edwardy',
      profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Edward'
    },
    likes: 10,
    replies: [
      {
        id: '203',
        content: 'Totally agree! The color palette and layout feel really polished.',
        createdAt: '2023-06-15T13:15:00Z',
        author: {
          id: '8',
          name: 'Fiona Gallagher',
          username: 'fionag',
          profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fiona'
        },
        likes: 3,
        replies: [
          {
            id: '301',
            content: 'Yes, and the typography is spot on. Nice job, team!',
            createdAt: '2023-06-15T13:25:00Z',
            author: {
              id: '9',
              name: 'George Martin',
              username: 'georgem',
              profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=George'
            },
            likes: 2,
            replies: []
          }
        ]
      }
    ]
  }
];

export const mockTweet: Tweet = {
  id: '123456',
  content: 'Just launched a new feature for our product! Check it out and let me know what you think. #innovation #tech',
  createdAt: '2023-06-15T08:00:00Z',
  author: mockUser,
  likes: 142,
  retweets: 35,
  views: 1200,
  comments: mockComments
};
