import { CVData, Icons } from './SimpleCVTypes';

export const CVLinks = {
  github: 'https://github.com/GDX64',
  linkedin: 'https://www.linkedin.com/in/gabriel-e-l-machado/',
  personalWebsite: 'https://glmachado.com',
  bachelorThesis:
    'https://github.com/GDX64/personal-react-website/blob/master/public/files/TCC.pdf?raw=true',
  profitWeb: 'https://profitweb.nelogica.com.br/',
  vectorWeb: 'https://web.vectorcrypto.com',
  profitMobile: 'https://apps.apple.com/br/app/profit-mobile/id1163760725',
  profitChartAndroid:
    'https://play.google.com/store/apps/details?id=profitchartandroid.nelogica.com.profitchartandroid&pcampaignid=web_share',
  profitChartMacOS: 'https://www.nelogica.com.br/download',
  IOS: 'https://apps.apple.com/br/app/profit-mobile/id1163760725',
  archpelagus: 'https://archpelagus.glmachado.com',
};

const glmachadoCVData: CVData = {
  name: 'Gabriel Eduardo de Lima Machado',
  title: 'Software Developer',
  arrUserInfo: [
    {
      icon: Icons.Globe,
      text: 'glmachado.com',
      link: CVLinks.personalWebsite,
    },
    { icon: Icons.Mobile, text: '+55 32 98493-5474' },
    { icon: Icons.Envelope, text: 'gabriel.delmachado@gmail.com' },
    { icon: Icons.GitHub, text: 'GDX64', link: CVLinks.github },
    { icon: Icons.Location, text: 'Porto Alegre, RS, BR' },
    {
      icon: Icons.Linkedin,
      text: 'gabriel-e-l-machado',
      link: CVLinks.linkedin,
    },
  ],
  categories: [
    {
      title: 'Experience',
      fields: [
        {
          title: 'Nelogica - Software Developer V',
          description:
            'Building international home broker platforms with AI-assisted workflows, real-time systems, and high-performance rendering using WebAssembly (Rust) and WebGPU.',
          schoolPlaceDate: 'Porto Alegre, RS, BR (On-site) | Jan 2026 - Present',
        },
        {
          title: 'Nelogica - Tech Lead - Administrative Systems',
          description:
            'Led a full-stack team responsible for the company intranet and extranet using PHP and TypeScript, driving the rewrite of both systems to modernize architecture and technology stack.',
          schoolPlaceDate: 'Porto Alegre, RS, BR | Jul 2025 - Jan 2026',
        },
        {
          title: 'Nelogica - Tech Lead - macOS and Web Platforms',
          description: `Led web and macOS trading products, including [Profit Web](${CVLinks.profitWeb}), with TypeScript, Electron, Web Workers, and WebSockets. Platforms reached tens of thousands of users and processed billions of dollars in monthly orders.`,
          schoolPlaceDate: 'Porto Alegre, RS, BR | Nov 2024 - Jul 2025',
        },
        {
          title: 'Nelogica - Software Developer IV',
          description: `Led development of [Profit Android](${CVLinks.profitChartAndroid}) and [Profit iOS](${CVLinks.profitMobile}) with TypeScript, Vue.js, Kotlin, and Swift. Mobile apps reached hundreds of thousands of active users and processed billions of dollars in monthly orders.`,
          schoolPlaceDate: 'Porto Alegre, RS, BR (On-site) | Jan 2024 - Dec 2024',
        },
        {
          title: 'Nelogica - Software Developer III',
          description: `Built and launched the first [Profit macOS](${CVLinks.profitChartMacOS}) platform with Electron and TypeScript for real-time market data and order execution.`,
          schoolPlaceDate: 'Porto Alegre, RS, BR (Remote) | Oct 2022 - Feb 2024',
        },
        {
          title: 'Nelogica - Software Developer II',
          description:
            'Improved runtime performance and initiated the migration of a multi-million-line JavaScript codebase to TypeScript.',
          schoolPlaceDate: 'Remote | Jul 2021 - Sep 2022',
        },
        {
          title: 'Nelogica - Software Developer I',
          description: `Built trading interfaces for [Profit Web](${CVLinks.profitWeb}) and [Vector Web](${CVLinks.vectorWeb}) using JavaScript, Vue.js, HTML, and CSS.`,
          schoolPlaceDate: 'Remote | Jul 2020 - Jul 2021',
        },
      ],
    },
    {
      title: 'Education',
      fields: [
        {
          title: "Master's in Data Visualization (In Progress)",
          schoolPlaceDate: 'UFRGS, Porto Alegre, RS, BR | In Progress',
          description:
            'Graduate studies focused on data visualization, visual analytics, and interactive systems.',
        },
        {
          title: "Bachelor's in Electronic Engineering",
          schoolPlaceDate: 'UFJF, Juiz de Fora, MG, BR | 2014 - 2019',
          description:
            'Emphasis on signal processing, embedded software, and electronics using Matlab, Python, and C with FreeRTOS.',
        },
        {
          schoolPlaceDate: 'UBA, Buenos Aires, AR | 2019',
          title: 'Electronic Engineering Exchange Program',
          description:
            'Graduate-level coursework in speech recognition, pattern recognition, biomedical signal processing, and adaptive filtering.',
        },
        {
          title: 'Electro-Mechanical Technician',
          schoolPlaceDate: 'ETPC, Volta Redonda, RJ, BR | 2011 - 2013',
        },
      ],
    },
    {
      title: 'Relevant Projects',
      fields: [
        {
          title: "Master's Research - GPU-Accelerated Time Series Visualization",
          description:
            'Research on GPU-accelerated, interactive time-series visualization for large datasets.',
          schoolPlaceDate: 'In Progress',
        },
        {
          title: 'Bachelor Thesis',
          description: `Implemented adaptive filtering algorithms in Matlab to analyze harmonics in electrical networks. Available
            [here](https://github.com/GDX64/personal-react-website/blob/master/public/files/TCC.pdf?raw=true).`,
          schoolPlaceDate: '2019',
        },
        {
          title: 'Personal Website',
          description: `Publishes experiments with custom 2D renderers and signal-based frameworks on my [website](${CVLinks.personalWebsite}).`,
        },
      ],
    },
  ],
};

export default glmachadoCVData;
