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
            'Focused on advancing trading platform development with practical AI adoption, sustaining high-performance real-time systems, building high-performance rendering pipelines with WebAssembly (compiled from Rust) and WebGPU, and delivering international home broker solutions for companies in Europe, Asia and the USA.',
          schoolPlaceDate: 'Porto Alegre - RS, BR (On-site). Jan 2026-Present',
        },
        {
          title: 'Nelogica - Tech Lead',
          description: `Led the engineering direction of web and desktop trading products, including [Profit Web](${CVLinks.profitWeb}) and the macOS platform, with a strong focus on real-time data pipelines using TypeScript, Electron, Web Workers, WebSockets, and Web Graphics APIs. Delivered the Copy Invest web application for automated strategy replication, guided front-end architecture and reusable core components, improved internal and client-facing web systems with PHP and TypeScript, and managed hiring, performance cycles, and execution planning for full-stack teams.`,
          schoolPlaceDate: 'Porto Alegre - RS, BR. Nov 2024-Jan 2026',
        },
        {
          title: 'Nelogica - Software Developer IV',
          description: `Acted as lead developer for mobile trading platforms, driving [Profit Android](${CVLinks.profitChartAndroid}) and [Profit iOS](${CVLinks.profitMobile}) with TypeScript, Vue.js, Kotlin, and Swift in a shared cross-platform architecture that supported live market feeds and order execution for a large active user base.`,
          schoolPlaceDate: 'Porto Alegre - RS, BR (On-site). Jan 2024-Dec 2024',
        },
        {
          title: 'Nelogica - Software Developer III',
          description: `Owned the technical delivery of the company's cross-platform desktop trading initiative by building and launching the first [Profit macOS](${CVLinks.profitChartMacOS}) version with Electron and TypeScript, enabling real-time market data streaming and order execution for a new user segment.`,
          schoolPlaceDate: 'Porto Alegre - RS, BR (Remote). Oct 2022-Feb 2024',
        },
        {
          title: 'Nelogica - Software Developer II',
          description:
            'Worked on runtime performance across processing and rendering layers while starting the migration of a multi-million-line JavaScript codebase to TypeScript, improving maintainability and long-term velocity.',
          schoolPlaceDate: 'Remote. Jul 2021-Sep 2022',
        },
        {
          title: 'Nelogica - Software Developer I',
          description: `Built front-end features for home broker and crypto trading products, including [Profit Web](${CVLinks.profitWeb}) and [Vector Web](${CVLinks.vectorWeb}), using JavaScript, Vue.js, HTML, and CSS to deliver responsive and reliable trading interfaces.`,
          schoolPlaceDate: 'Remote. Jul 2020-Jul 2021',
        },
      ],
    },
    {
      title: 'Education',
      fields: [
        {
          title: "Master's in Data Visualization (In Progress)",
          schoolPlaceDate: 'UFRGS - Porto Alegre, RS, BR. Ongoing',
          description:
            'Currently pursuing graduate studies focused on advanced data visualization methods, visual analytics, and interactive systems for large and dynamic datasets.',
        },
        {
          title: "Bachelor's in Electronic Engineering",
          schoolPlaceDate: 'UFJF - Juiz de Fora, MG. 2014-2019',
          description:
            'The program emphasized signal processing, embedded software development, and electronics, with hands-on work in Matlab, Python, and C with FreeRTOS.',
        },
        {
          schoolPlaceDate: 'UBA - Buenos Aires, AR. 2019',
          title: 'Electronic Engineering Exchange Program',
          description: `I took master's classes: speech recognition, pattern recognition,
           biomedical signal processing, adaptive filtering.`,
        },
        {
          title: 'Electro-Mechanical Technician',
          schoolPlaceDate: 'ETPC - Volta Redonda, RJ. 2011-2013',
        },
      ],
    },
    {
      title: 'Relevant Projects',
      fields: [
        {
          title: "Master's Research - GPU-Accelerated Time Series Visualization",
          description:
            "Researching high-performance techniques for interactive time series visualization in my master's studies, with emphasis on GPU acceleration, scalable rendering pipelines, and smooth exploration of large temporal datasets.",
          schoolPlaceDate: 'Ongoing',
        },
        {
          title: 'Bachelor Thesis',
          description: `In my thesis I implemented adaptive filtering algorithms from papers with
            Matlab to analyze harmonics from the electrical energy network. In this work I
            had the opportunity to work with some advanced Linear Algebra to implement the
            computations. You can download it 
            [here](https://github.com/GDX64/personal-react-website/blob/master/public/files/TCC.pdf?raw=true).`,
          schoolPlaceDate: '2019',
        },
        {
          title: 'Personal Website',
          description: `I use my [website](${CVLinks.personalWebsite}) mainly to publish demos experimenting with custom 2D renderers for signal-based frameworks like Solid and Vue.`,
        },
      ],
    },
  ],
};

export default glmachadoCVData;
