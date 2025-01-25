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
      link: CVLinks.github,
    },
  ],
  categories: [
    {
      title: 'Education',
      fields: [
        {
          title: 'Electronic Engineering Bachelor',
          schoolPlaceDate: 'UFJF - Juiz de fora, MG. 2014-2019',
          description:
            'The course had more emphasis in Signal Processing, embedded software development and electronics, where I used Matlab, Python, and C with FreeRTOS.',
        },
        {
          schoolPlaceDate: 'UBA - Buenos Aires, AR. 2019',
          title: 'Electronic Engineering Interchange',
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
      title: 'Experiences',
      fields: [
        {
          title: 'Nelogica - Software Development Lead',
          description: `
          Nelogica is the biggest trading software company in Brazil, and has several trading platforms. 
          I came to the company I to work as a web developer in the homebrokers, 
          [profit web](${CVLinks.profitWeb}) and [vector web](${CVLinks.vectorWeb}) applications using vue and javascript.
          Later on I started to guide my work towards performance improvements and async operations handling.
          As the project grew we started to work with typescript and ported our product to [MacOS](${CVLinks.profitChartMacOS}) using electron, bringing the company to the MacOS users.
          In 2023 I was invited to work in the company's headquarters in Porto Alegre and started to work with the mobile team, and
          led technically the development of native mobile apps using the core web code. Now we target web, [Android](${CVLinks.profitChartAndroid}),
          [iOS](${CVLinks.IOS}) and MacOS with the same main codebase and some native adjusts.
          In late 2024 I started a new role as the team leader of our web and macOS products, as well as the core web code.`,
          schoolPlaceDate: 'Porto Alegre - RS, BR. 2024-(Now)',
        },
        {
          title: 'Nelogica - Software Developer IV',
          schoolPlaceDate: 'Porto Alegre - RS, BR. 2023-(Now)',
        },
        {
          title: 'Nelogica - Software Developer III',
          schoolPlaceDate: '(Remote) 2022-2023',
        },
        {
          title: 'Nelogica - Software Developer II',
          schoolPlaceDate: '(Remote) 2021-2022',
        },
        {
          title: 'Nelogica - Software Developer I',
          schoolPlaceDate: '(Remote) 2020-2021',
        },
      ],
    },
    {
      title: 'Relevant Projects',
      fields: [
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
          description: `I use my [website](${CVLinks.personalWebsite}) mainly to upload demos experimenting with custom 2D renderers for signal based frameworks like solid and vue.`,
        },
      ],
    },
  ],
};

export default glmachadoCVData;
