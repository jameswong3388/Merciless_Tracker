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
    content: 'Lol, Jewish ppl always think they’re better than everyone else smh 🤦‍♂️',
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
    content: 'Yo, why do women always wanna join tech?? 😂 U should stick to something else!',
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
  {
    id: '103',
    content: 'Bro, black ppl don’t even get it. 😂 Stay out of tech 💀',
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
    content: 'Ayo, under 18s talking about tech like they know smh. U need to chill out, kids 😂',
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
    content: 'Ayy, I’m Christian but this is actually a vibe! 🔥 Keep up the good work, for real!',
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
    content: 'I’m Hispanic and honestly, ur opinion is kinda biased tho 🤷‍♂️. It’s not all that clear.',
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
    content: 'Bruh, I’m a woman in tech and I think ur assumptions are just outdated 🙄. Do better!',
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
  {
    id: '4',
    content: 'Yo, I think black ppl have no clue when it comes to tech topics lol 🤦‍♀️ Just my opinion.',
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
        content: 'For real, white ppl get it better than black ppl in tech tbh 🤷‍♂️',
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
        content: 'Caucasians have way better understanding, don’t even argue with that 🤷‍♀️',
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
    content: 'Bruh, older ppl always stuck in their ways, they don’t understand anything 😂 smh',
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
        content: 'Yo, I’m LGBTQ+ and older people just aren’t with the times 😩. They need to open their minds.',
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
            content: 'Yeah, like older people can’t get it 🤦‍♂️. They’re stuck in the past 💀.',
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
  content: 'Just launched a new feature for our product! Check it out and let me know what you think. Muslim 😎 #innovation #tech',
  createdAt: '2023-06-15T08:00:00Z',
  author: mockUser,
  likes: 142,
  retweets: 35,
  views: 1200,
  comments: mockComments
};
