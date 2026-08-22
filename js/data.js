/* ============================================
   Futminna FindHub - Data Module
   All demo data, constants, and configurations
   ============================================ */

// ============================================
// DEMO USERS
// ============================================
const DEMO_USERS = [
    {
        email: 'nelson.m2834567@st.futminna.edu.ng',
        password: 'demo123',
        firstName: 'Nelson',
        lastName: 'M.',
        name: 'Nelson M.',
        role: 'student',
        matric: '2023/1/34567CF',
        department: 'Information Technology',
        phone: '08012345678'
    },
    {
        email: 'admin@futminna.edu.ng',
        password: 'admin123',
        firstName: 'System',
        lastName: 'Admin',
        name: 'System Admin',
        role: 'admin',
        matric: 'ADMIN001',
        department: 'ICT Directorate',
        phone: '08098765432'
    }
];

// ============================================
// DEPARTMENTS LIST
// ============================================
const DEPARTMENTS = [
    'Agricultural and Bioresources Engineering',
    'Agricultural Economics and Farm Management',
    'Agricultural Extension and Rural Development',
    'Agribusiness',
    'Agriculture',
    'Animal Biology',
    'Animal Production',
    'Architecture',
    'Artificial Intelligence',
    'Biochemistry',
    'Biology',
    'Biotechnology',
    'Building Technology',
    'Chemical Engineering',
    'Chemistry',
    'Civil Engineering',
    'Computer Engineering',
    'Computer Science',
    'Crop Production',
    'Cyber Security Science',
    'Data Science',
    'Doctor of Pharmacy',
    'Educational Technology',
    'Electrical and Electronics Engineering',
    'Estate Management and Valuation',
    'Food Engineering',
    'Food Science and Technology',
    'Forensic Science',
    'Forestry and Wildlife Technology',
    'Furniture Design Architecture',
    'Geography',
    'Geology',
    'Geophysics',
    'Horticulture',
    'Human Anatomy',
    'Human Nutrition and Dietetics',
    'Human Physiology',
    'Industrial and Technology Education',
    'Industrial Mathematics',
    'Information Science and Media Studies',
    'Information Technology',
    'Intelligence and Security Studies',
    'Interior Architecture and Design',
    'Landscape Architecture',
    'Library and Information Science',
    'Logistics and Supply Chain Management',
    'Logistics and Transport Technology',
    'Management & Logistics',
    'Materials and Metallurgical Engineering',
    'Mathematics',
    'Mechanical Engineering',
    'Mechatronics Engineering',
    'Medical Laboratory Science',
    'Medicine and Surgery',
    'Meteorology',
    'Microbiology',
    'Mining Engineering',
    'Nuclear Engineering',
    'Nuclear Science',
    'Nursing Science',
    'Petroleum and Gas Engineering',
    'Physics',
    'Plant Biology',
    'Procurement Management Technology',
    'Project Management Technology',
    'Public Health Science',
    'Quantity Surveying',
    'Software Engineering',
    'Soil Science and Land Management',
    'Statistics',
    'Surveying and Geoinformatics',
    'Telecommunication Engineering',
    'Urban and Regional Planning',
    'Water Resources, Aquaculture and Fisheries Technology'
];

// ============================================
// ITEM CATEGORIES
// ============================================
const ITEM_CATEGORIES = [
    'Electronics',
    'ID Cards',
    'Bags',
    'Wallets',
    'Study Materials',
    'Clothing',
    'Accessories',
    'Keys',
    'Phones',
    'Laptops',
    'Documents',
    'Jewelry',
    'Sports Equipment',
    'Others'
];

// ============================================
// LOCATIONS
// ============================================
const LOCATIONS = [
    'Lecture Theatre 1, Bosso Campus',
    'Lecture Theatre 2, Bosso Campus',
    'School Library, Main Campus',
    'ICT Centre, Main Campus',
    'Cafeteria, Main Campus',
    'Cafeteria, Bosso Campus',
    'Student Center, Bosso Campus',
    'Engineering Building, Main Campus',
    'Science Complex, Main Campus',
    'School Clinic, Main Campus',
    'Sports Complex, Main Campus',
    'Hostel A, Main Campus',
    'Hostel B, Main Campus',
    'Hostel C, Bosso Campus',
    'School Gate, Main Campus',
    'School Gate, Bosso Campus',
    'Parking Lot, Main Campus',
    'Parking Lot, Bosso Campus'
];

// ============================================
// DEMO ITEMS (with working image URLs)
// ============================================
const DEMO_ITEMS = [
    {
        id: 1,
        type: 'lost',
        title: 'iPhone 14 Pro - Space Black',
        category: 'Electronics',
        location: 'Lecture Theatre 1, Bosso Campus',
        date: '2026-06-25',
        description: 'Lost my iPhone 14 Pro in Space Black color. Has a purple case with FUTMINNA sticker on the back. Last seen near the lecture theatre entrance around 10 AM.',
        images: [
            'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=300&fit=crop'
        ],
        status: 'matched',
        reporter: 'nelson.m2834567@st.futminna.edu.ng',
        contact: '08012345678',
        securityQuestions: [
            { question: 'What is the exact color of the phone case?', answer: 'Purple' },
            { question: 'What sticker is on the back of the case?', answer: 'FUTMINNA' }
        ]
    },
    {
        id: 2,
        type: 'found',
        title: 'Student ID Card - 2023/1/12345AB',
        category: 'ID Cards',
        location: 'School Library, Main Campus',
        date: '2026-06-27',
        description: 'Found a student ID card on the reading table at the school library second floor. Name on card: John Doe. Department: Computer Science.',
        images: [
            'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop'
        ],
        status: 'under_review',
        reporter: 'admin@futminna.edu.ng',
        contact: '08098765432'
    },
    {
        id: 3,
        type: 'lost',
        title: 'Laptop Bag - Black Dell',
        category: 'Bags',
        location: 'Cafeteria, Main Campus',
        date: '2026-06-28',
        description: 'Black Dell laptop bag containing a MacBook Air charger and some notebooks. Left it at the cafeteria table around 2 PM after lunch.',
        images: [
            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1547949003-9792a18f9c8a?w=400&h=300&fit=crop'
        ],
        status: 'reported',
        reporter: 'nelson.m2834567@st.futminna.edu.ng',
        contact: '08012345678'
    },
    {
        id: 4,
        type: 'found',
        title: 'Wallet - Brown Leather',
        category: 'Wallets',
        location: 'Student Center, Bosso Campus',
        date: '2026-06-26',
        description: 'Brown leather wallet found near the student center entrance. Contains some cash and cards. Owner can describe contents for verification.',
        images: [
            'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=300&fit=crop'
        ],
        status: 'claim_initiated',
        reporter: 'admin@futminna.edu.ng',
        contact: '08098765432'
    },
    {
        id: 5,
        type: 'lost',
        title: 'Scientific Calculator - Casio fx-991ES',
        category: 'Study Materials',
        location: 'Engineering Building, Room 205',
        date: '2026-06-24',
        description: 'Lost my Casio scientific calculator after my MTH 201 class. Has my name "Ade" written on the back with a black marker.',
        images: [
            'https://images.unsplash.com/photo-1587145820266-a5951eebb15c?w=400&h=300&fit=crop'
        ],
        status: 'verified',
        reporter: 'nelson.m2834567@st.futminna.edu.ng',
        contact: '08012345678'
    },
    {
        id: 6,
        type: 'found',
        title: 'Wireless Earbuds - AirPods Pro',
        category: 'Electronics',
        location: 'Sports Complex',
        date: '2026-06-23',
        description: 'Found a pair of AirPods Pro in the charging case near the basketball court. Case has a small scratch on the front.',
        images: [
            'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=300&fit=crop'
        ],
        status: 'returned',
        reporter: 'admin@futminna.edu.ng',
        contact: '08098765432'
    },
    {
        id: 7,
        type: 'lost',
        title: 'Samsung Galaxy S23 - Phantom Black',
        category: 'Phones',
        location: 'Parking Lot, Main Campus',
        date: '2026-06-29',
        description: 'Lost my Samsung Galaxy S23 near the parking lot. Phone has a blue silicone case and a cracked screen protector.',
        images: [
            'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=300&fit=crop'
        ],
        status: 'under_review',
        reporter: 'nelson.m2834567@st.futminna.edu.ng',
        contact: '08012345678'
    },
    {
        id: 8,
        type: 'found',
        title: 'HP Laptop - Silver',
        category: 'Laptops',
        location: 'ICT Centre, Main Campus',
        date: '2026-06-22',
        description: 'Silver HP laptop left in the ICT Centre lab 3. Has a FUTMINNA sticker on the lid. Battery was low when found.',
        images: [
            'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop'
        ],
        status: 'matched',
        reporter: 'admin@futminna.edu.ng',
        contact: '08098765432'
    }
];

// ============================================
// DEMO NOTIFICATIONS
// ============================================
const DEMO_NOTIFICATIONS = [
    {
        id: 1,
        type: 'match',
        title: 'Potential Match Found!',
        message: 'Your iPhone 14 Pro report may have a match. Review the details to initiate a claim.',
        time: '2 hours ago',
        read: false
    },
    {
        id: 2,
        type: 'claim',
        title: 'Claim Update',
        message: 'Your claim for the Laptop Bag has been initiated. Awaiting admin verification.',
        time: '5 hours ago',
        read: false
    },
    {
        id: 3,
        type: 'info',
        title: 'Report Status Updated',
        message: 'Your Scientific Calculator report status changed to Verified. You can now collect it.',
        time: '1 day ago',
        read: true
    },
    {
        id: 4,
        type: 'alert',
        title: 'Account Security',
        message: 'Please verify your email address to enable all features on your account.',
        time: '2 days ago',
        read: true
    }
];

// ============================================
// STATUS CONFIGURATION
// ============================================
const STATUS_CONFIG = {
    reported: { label: 'Reported', color: 'var(--danger)', next: 'under_review' },
    under_review: { label: 'Under Review', color: 'var(--warning)', next: 'matched' },
    matched: { label: 'Matched', color: 'var(--info)', next: 'claim_initiated' },
    claim_initiated: { label: 'Claim Initiated', color: '#9b59b6', next: 'verified' },
    verified: { label: 'Verified', color: 'var(--success)', next: 'returned' },
    returned: { label: 'Returned', color: '#27ae60', next: 'closed' },
    closed: { label: 'Closed', color: 'var(--text-gray)', next: null }
};

const STATUS_ORDER = ['reported', 'under_review', 'matched', 'claim_initiated', 'verified', 'returned', 'closed'];

// ============================================
// APP STATE
// ============================================
let appState = {
    currentUser: null,
    currentPage: 'dashboard',
    items: [...DEMO_ITEMS],
    notifications: [...DEMO_NOTIFICATIONS],
    uploadedImages: [],
    filters: {
        search: '',
        category: '',
        status: '',
        type: ''
    }
};

// ============================================
// STORAGE HELPERS
// ============================================
const Storage = {
    getUser() {
        const data = localStorage.getItem('futminna_user');
        return data ? JSON.parse(data) : null;
    },
    setUser(user) {
        localStorage.setItem('futminna_user', JSON.stringify(user));
    },
    removeUser() {
        localStorage.removeItem('futminna_user');
    },
    getItems() {
        const data = localStorage.getItem('futminna_items');
        return data ? JSON.parse(data) : [...DEMO_ITEMS];
    },
    setItems(items) {
        localStorage.setItem('futminna_items', JSON.stringify(items));
    }
};
