export interface MemberData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  phoneVisible?: boolean;
  linkedin?: string;
  program: string;
  graduationYear: number;
  currentOrg: string;
  orgType: string;
  role: string;
  city: string;
  country: string;
  yearsExperience: number;
  interests: string[];
  status: 'approved' | 'pending' | 'rejected';
  joinDate: string;
}

export const sampleMembers: MemberData[] = [
  {
    id: "1",
    firstName: "Rajesh",
    lastName: "Kumar",
    email: "rajesh.kumar@example.com",
    phone: "+91-98765-43210",
    phoneVisible: true,
    linkedin: "https://linkedin.com/in/rajeshkumar",
    program: "MBA-PGDBM",
    graduationYear: 2018,
    currentOrg: "Apollo Hospitals",
    orgType: "Hospital/Clinic",
    role: "Vice President - Operations",
    city: "Mumbai",
    country: "India",
    yearsExperience: 8,
    interests: ["Healthcare Operations", "Digital Health", "Patient Care"],
    status: "approved",
    joinDate: "2023-01-15"
  },
  {
    id: "2",
    firstName: "Priya",
    lastName: "Sharma",
    email: "priya.sharma@example.com",
    phone: "+91-87654-32109",
    phoneVisible: false,
    linkedin: "https://linkedin.com/in/priyasharma",
    program: "MBA-PGPX",
    graduationYear: 2019,
    currentOrg: "Practo Technologies",
    orgType: "HealthTech",
    role: "Product Manager",
    city: "Bangalore",
    country: "India",
    yearsExperience: 6,
    interests: ["HealthTech", "Product Strategy", "User Experience"],
    status: "approved",
    joinDate: "2023-02-20"
  },
  {
    id: "3",
    firstName: "Dr. Amit",
    lastName: "Patel",
    email: "amit.patel@example.com",
    phone: "+1-555-123-4567",
    phoneVisible: true,
    linkedin: "https://linkedin.com/in/dramitpatel",
    program: "MBA-FABM",
    graduationYear: 2015,
    currentOrg: "Pfizer Inc.",
    orgType: "Pharmaceutical",
    role: "Director - Medical Affairs",
    city: "New York",
    country: "USA",
    yearsExperience: 12,
    interests: ["Pharmaceutical Research", "Regulatory Affairs", "Clinical Trials"],
    status: "approved",
    joinDate: "2023-01-10"
  },
  {
    id: "4",
    firstName: "Sneha",
    lastName: "Agarwal",
    email: "sneha.agarwal@example.com",
    phone: "+91-76543-21098",
    phoneVisible: true,
    linkedin: "https://linkedin.com/in/snehaagarwal",
    program: "MBA-PGDBM",
    graduationYear: 2020,
    currentOrg: "Sequoia Capital",
    orgType: "VC",
    role: "Principal",
    city: "Gurgaon",
    country: "India",
    yearsExperience: 4,
    interests: ["Healthcare Investments", "Digital Health", "MedTech"],
    status: "approved",
    joinDate: "2023-03-05"
  },
  {
    id: "5",
    firstName: "Dr. Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@example.com",
    phone: "+1-555-987-6543",
    phoneVisible: false,
    linkedin: "https://linkedin.com/in/drsarahjohnson",
    program: "PhD",
    graduationYear: 2017,
    currentOrg: "Johns Hopkins University",
    orgType: "Academic/Research",
    role: "Associate Professor",
    city: "Baltimore",
    country: "USA",
    yearsExperience: 10,
    interests: ["Public Health", "Health Policy", "Research"],
    status: "approved",
    joinDate: "2023-01-25"
  },
  {
    id: "6",
    firstName: "Vikram",
    lastName: "Singh",
    email: "vikram.singh@example.com",
    phone: "+91-65432-10987",
    phoneVisible: true,
    linkedin: "https://linkedin.com/in/vikramsingh",
    program: "MBA-PGDBM",
    graduationYear: 2016,
    currentOrg: "Medtronic India",
    orgType: "Medical Devices",
    role: "Country Manager",
    city: "Delhi",
    country: "India",
    yearsExperience: 9,
    interests: ["Medical Devices", "Innovation", "Market Strategy"],
    status: "approved",
    joinDate: "2023-02-14"
  },
  {
    id: "7",
    firstName: "Lisa",
    lastName: "Chen",
    email: "lisa.chen@example.com",
    phone: "+1-555-456-7890",
    phoneVisible: true,
    linkedin: "https://linkedin.com/in/lisachen",
    program: "MBA-PGPX",
    graduationYear: 2021,
    currentOrg: "Teladoc Health",
    orgType: "HealthTech",
    role: "Senior Consultant",
    city: "San Francisco",
    country: "USA",
    yearsExperience: 3,
    interests: ["Telemedicine", "Digital Transformation", "AI in Healthcare"],
    status: "approved",
    joinDate: "2023-03-12"
  },
  {
    id: "8",
    firstName: "Ravi",
    lastName: "Krishnamurthy",
    email: "ravi.k@example.com",
    phone: "+91-54321-09876",
    phoneVisible: false,
    linkedin: "https://linkedin.com/in/ravikrishnamurthy",
    program: "MBA-PGDBM",
    graduationYear: 2014,
    currentOrg: "Star Health Insurance",
    orgType: "Health Insurance",
    role: "Head of Product",
    city: "Chennai",
    country: "India",
    yearsExperience: 11,
    interests: ["Health Insurance", "Product Development", "Analytics"],
    status: "approved",
    joinDate: "2023-01-30"
  }
];

export const filterOptions = {
  programs: [
    "MBA-PGDBM",
    "MBA-FABM", 
    "MBA-PGPX",
    "PhD",
    "MBA-FPGP",
    "ePGD-ABA",
    "FDP",
    "AFP",
    "SMP"
  ],
  orgTypes: [
    "Hospital/Clinic",
    "HealthTech",
    "Pharmaceutical",
    "Biotech",
    "Medical Devices",
    "Consulting",
    "Public Health/Policy", 
    "Health Insurance",
    "Academic/Research",
    "Startup",
    "VC"
  ],
  graduationYears: [
    "2024", "2023", "2022", "2021", "2020",
    "2019", "2018", "2017", "2016", "2015",
    "2014", "2013", "2012", "2011", "2010"
  ],
  locations: [
    "Mumbai, India",
    "Bangalore, India", 
    "Delhi, India",
    "Chennai, India",
    "Gurgaon, India",
    "New York, USA",
    "San Francisco, USA",
    "Baltimore, USA",
    "London, UK",
    "Singapore"
  ],
  experienceLevels: [
    "0-2 years",
    "3-5 years", 
    "6-10 years",
    "11-15 years",
    "15+ years"
  ]
};