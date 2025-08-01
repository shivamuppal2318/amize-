// import { VideoItemData } from '@/components/VideoFeed/VideoItem';
//
// export const mockVideos: VideoItemData[] = [
//     {
//         id: '1',
//         user: {
//             id: 'user1',
//             username: 'user_name',
//             name: 'Creative Artist',
//             avatar: 'https://randomuser.me/api/portraits/women/43.jpg',
//             verified: true,
//             followerCount: 1200000
//         },
//         video: {
//             // Using Pexels video - reliable source for test videos
//             uri: 'https://videos.pexels.com/video-files/6646665/6646665-hd_1080_1920_24fps.mp4',
//             poster: 'https://images.pexels.com/photos/31313204/pexels-photo-31313204/free-photo-of-charming-narrow-street-in-gorlitz-germany.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
//             aspectRatio: 9/16
//         },
//         description: 'Summer vibes only ☀️ #trending #summer #vibes',
//         likeCount: 999,
//         commentCount: 1245,
//         shareCount: 1123,
//         bookmarkCount: 1823,
//         timestamp: '2 hours ago',
//         music: {
//             name: 'Original Sound - Creative Artist',
//             id: 'music1'
//         }
//     },
//     {
//         id: '2',
//         user: {
//             id: 'user2',
//             username: 'dancestar',
//             name: 'Dance Star',
//             avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
//             verified: true,
//             followerCount: 3400000
//         },
//         video: {
//             uri: 'https://videos.pexels.com/video-files/6624853/6624853-uhd_1440_2560_30fps.mp4',
//             poster: 'https://images.pexels.com/photos/30910224/pexels-photo-30910224/free-photo-of-delicious-chocolate-cake-with-pistachios.jpeg?auto=compress&cs=tinysrgb&w=1200&lazy=load',
//             aspectRatio: 9/16
//         },
//         description: 'New dance trend! Try it out 💃 #dance #newtrendchallenge',
//         likeCount: 245000,
//         commentCount: 3245,
//         shareCount: 2123,
//         bookmarkCount: 4823,
//         timestamp: '5 hours ago',
//         music: {
//             name: 'Dance Beats - DJ Mix',
//             id: 'music2'
//         }
//     },
//     {
//         id: '3',
//         user: {
//             id: 'user3',
//             username: 'travel_addiction',
//             name: 'Travel Addicted',
//             avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
//             verified: false,
//             followerCount: 567000
//         },
//         video: {
//             uri: 'https://videos.pexels.com/video-files/8344235/8344235-uhd_1440_2560_25fps.mp4',
//             poster: 'https://images.pexels.com/photos/31085625/pexels-photo-31085625/free-photo-of-small-bird-perched-on-wire-against-soft-background.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
//             aspectRatio: 9/16
//         },
//         description: 'Morning routine in Bali 🌴 #travel #bali #morningroutine',
//         likeCount: 87600,
//         commentCount: 776,
//         shareCount: 623,
//         bookmarkCount: 1203,
//         timestamp: '1 day ago',
//         music: {
//             name: 'Bali Vibes - Tropical Sounds',
//             id: 'music3'
//         }
//     },
//     {
//         id: '4',
//         user: {
//             id: 'user4',
//             username: 'food_lover',
//             name: 'Gourmet Explorer',
//             avatar: 'https://randomuser.me/api/portraits/men/44.jpg',
//             verified: true,
//             followerCount: 890000
//         },
//         video: {
//             uri: 'https://videos.pexels.com/video-files/3099415/3099415-uhd_2560_1440_30fps.mp4',
//             poster: 'https://images.pexels.com/photos/29957631/pexels-photo-29957631/free-photo-of-serene-evening-coffee-in-golden-light.jpeg?auto=compress&cs=tinysrgb&w=1200&lazy=load',
//             aspectRatio: 9/16
//         },
//         description: 'When the beat drops 🔥 #nightlife #party #weekend',
//         likeCount: 324500,
//         commentCount: 2198,
//         shareCount: 1876,
//         bookmarkCount: 2543,
//         timestamp: '3 days ago',
//         music: {
//             name: 'Club Bangers Vol. 3 - DJ Remix',
//             id: 'music4'
//         }
//     },
//     {
//         id: '5',
//         user: {
//             id: 'user5',
//             username: 'tech_guru',
//             name: 'Tech Enthusiast',
//             avatar: 'https://randomuser.me/api/portraits/women/22.jpg',
//             verified: true,
//             followerCount: 1500000
//         },
//         video: {
//             uri: 'https://videos.pexels.com/video-files/7247861/7247861-hd_1080_1920_30fps.mp4',
//             poster: 'https://images.pexels.com/photos/31249687/pexels-photo-31249687/free-photo-of-elegant-coffee-and-dessert-display-in-cafe.jpeg?auto=compress&cs=tinysrgb&w=1200&lazy=load',
//             aspectRatio: 9/16
//         },
//         description: 'Morning run motivation 🏃‍♀️ Start your day with energy! #fitness #motivation',
//         likeCount: 157800,
//         commentCount: 1389,
//         shareCount: 892,
//         bookmarkCount: 3267,
//         timestamp: '1 week ago',
//         music: {
//             name: 'Fitness Beats - Workout Mix',
//             id: 'music5'
//         }
//     }
// ];

import { VideoItemData } from '@/components/VideoFeed/VideoItem';
import { ApiVideo } from '@/lib/api/types/video';
import { adaptVideoForUI } from '@/lib/adapters/videoAdapter';

// Mock API videos for testing without actual API
export const mockApiVideos: ApiVideo[] = [
    {
        id: '1',
        title: 'Summer vibes',
        description: 'Summer vibes only ☀️ #trending #summer #vibes',
        videoUrl: 'https://videos.pexels.com/video-files/6646665/6646665-hd_1080_1920_24fps.mp4',
        thumbnailUrl: 'https://images.pexels.com/photos/31313204/pexels-photo-31313204/free-photo-of-charming-narrow-street-in-gorlitz-germany.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        duration: 15.5,
        isPublic: true,
        user: {
            id: 'user1',
            username: 'user_name',
            profilePhotoUrl: 'https://randomuser.me/api/portraits/women/43.jpg',
            fullName: 'Creative Artist',
            creatorVerified: true
        },
        sound: {
            id: 'sound1',
            title: 'Original Sound',
            artistName: 'Creative Artist',
            soundUrl: '/sounds/original-sound.mp3',
            duration: 15.5
        },
        likesCount: 999,
        commentsCount: 1245,
        viewsCount: 54321,
        sharesCount: 1123,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString()
    },
    {
        id: '2',
        title: 'New dance trend',
        description: 'New dance trend! Try it out 💃 #dance #newtrendchallenge',
        videoUrl: 'https://videos.pexels.com/video-files/6624853/6624853-uhd_1440_2560_30fps.mp4',
        thumbnailUrl: 'https://images.pexels.com/photos/30910224/pexels-photo-30910224/free-photo-of-delicious-chocolate-cake-with-pistachios.jpeg?auto=compress&cs=tinysrgb&w=1200&lazy=load',
        duration: 22.3,
        isPublic: true,
        user: {
            id: 'user2',
            username: 'dancestar',
            profilePhotoUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
            fullName: 'Dance Star',
            creatorVerified: true
        },
        sound: {
            id: 'sound2',
            title: 'Dance Beats',
            artistName: 'DJ Mix',
            soundUrl: '/sounds/dance-beats.mp3',
            duration: 22.3
        },
        likesCount: 245000,
        commentsCount: 3245,
        viewsCount: 1200000,
        sharesCount: 2123,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
    },
    {
        id: '3',
        title: 'Morning in Bali',
        description: 'Morning routine in Bali 🌴 #travel #bali #morningroutine',
        videoUrl: 'https://videos.pexels.com/video-files/8344235/8344235-uhd_1440_2560_25fps.mp4',
        thumbnailUrl: 'https://images.pexels.com/photos/31085625/pexels-photo-31085625/free-photo-of-small-bird-perched-on-wire-against-soft-background.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        duration: 45.8,
        isPublic: true,
        user: {
            id: 'user3',
            username: 'travel_addiction',
            profilePhotoUrl: 'https://randomuser.me/api/portraits/women/65.jpg',
            fullName: 'Travel Addicted',
            creatorVerified: false
        },
        sound: {
            id: 'sound3',
            title: 'Bali Vibes',
            artistName: 'Tropical Sounds',
            soundUrl: '/sounds/bali-vibes.mp3',
            duration: 45.8
        },
        likesCount: 87600,
        commentsCount: 776,
        viewsCount: 450000,
        sharesCount: 623,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString()
    },
    {
        id: '4',
        title: 'When the beat drops',
        description: 'When the beat drops 🔥 #nightlife #party #weekend',
        videoUrl: 'https://videos.pexels.com/video-files/3099415/3099415-uhd_2560_1440_30fps.mp4',
        thumbnailUrl: 'https://images.pexels.com/photos/29957631/pexels-photo-29957631/free-photo-of-serene-evening-coffee-in-golden-light.jpeg?auto=compress&cs=tinysrgb&w=1200&lazy=load',
        duration: 30.2,
        isPublic: true,
        user: {
            id: 'user4',
            username: 'food_lover',
            profilePhotoUrl: 'https://randomuser.me/api/portraits/men/44.jpg',
            fullName: 'Gourmet Explorer',
            creatorVerified: true
        },
        sound: {
            id: 'sound4',
            title: 'Club Bangers Vol. 3',
            artistName: 'DJ Remix',
            soundUrl: '/sounds/club-bangers.mp3',
            duration: 30.2
        },
        likesCount: 324500,
        commentsCount: 2198,
        viewsCount: 890000,
        sharesCount: 1876,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
    },
    {
        id: '5',
        title: 'Morning run motivation',
        description: 'Morning run motivation 🏃‍♀️ Start your day with energy! #fitness #motivation',
        videoUrl: 'https://videos.pexels.com/video-files/7247861/7247861-hd_1080_1920_30fps.mp4',
        thumbnailUrl: 'https://images.pexels.com/photos/31249687/pexels-photo-31249687/free-photo-of-elegant-coffee-and-dessert-display-in-cafe.jpeg?auto=compress&cs=tinysrgb&w=1200&lazy=load',
        duration: 18.7,
        isPublic: true,
        user: {
            id: 'user5',
            username: 'tech_guru',
            profilePhotoUrl: 'https://randomuser.me/api/portraits/women/22.jpg',
            fullName: 'Tech Enthusiast',
            creatorVerified: true
        },
        sound: {
            id: 'sound5',
            title: 'Fitness Beats',
            artistName: 'Workout Mix',
            soundUrl: '/sounds/fitness-beats.mp3',
            duration: 18.7
        },
        likesCount: 157800,
        commentsCount: 1389,
        viewsCount: 678000,
        sharesCount: 892,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString()
    }
];

// Convert API format to UI format for the mock data
export const mockVideos: VideoItemData[] = mockApiVideos.map(video => adaptVideoForUI(video));