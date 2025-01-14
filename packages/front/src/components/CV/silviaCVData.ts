import { CVData, Icons } from './SimpleCVTypes';

export const CVLinks = {
  github: 'https://github.com/GDX64',
  linkedin: 'https://www.linkedin.com/in/s%C3%ADlvia-lunardi-remuzzi-b15059168/',
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
  name: 'Sílvia Lunardi Remuzzi',
  title: 'Farmacêutica',
  arrUserInfo: [
    { icon: Icons.Mobile, text: '+55 51 99640-7275' },
    { icon: Icons.Envelope, text: 'silvia.remuzzi@gmail.com' },
    { icon: Icons.Location, text: 'Porto Alegre, RS, BR' },
    {
      icon: Icons.Linkedin,
      text: 'sílvia-lunardi-remuzzi',
      link: CVLinks.linkedin,
    },
  ],
  categories: [
    {
      title: 'Formação',
      fields: [
        {
          title: 'Residência em Atenção ao Paciente Crítico',
          schoolPlaceDate: 'Grupo Hospitalar Conceição - Porto Alegre, 2023-2025',
          description: 'Residência multiprofissional em atenção ao paciente crítico.',
        },
        {
          title: 'Graduação em Farmácia',
          schoolPlaceDate: 'UFSM - Santa Maria, RS. 2013-2018',
          description:
            'Durante a graduação, participei de projetos de extensão e pesquisa, com ênfase em farmacologia e farmácia clínica.',
        },
        {
          title: 'Pós Graduação em Atenção Farmacêutica e Farmácia Clínica',
          schoolPlaceDate: 'Estácio de Sá - Porto Alegre, 2021-2022',
        },
      ],
    },
    {
      title: 'Experiências',
      fields: [
        {
          title: 'Residência em Atenção ao Paciente Crítico',
          description: `
            Durante a residência, participei de atendimentos em UTI, emergência e enfermaria, com foco em pacientes críticos
          `,
          schoolPlaceDate: 'GHC - Porto Alegre, 2023-Presente',
        },
        {
          title: 'Estágio em Farmácia Satélite da UTI',
          description: ``,
          schoolPlaceDate: 'Hospital Ernesto Dornelles - Porto Alegre, 2024',
        },
        {
          title: 'Estágio em Farmácia Satélite da UTI',
          description: ``,
          schoolPlaceDate: 'Hospital Mãe de Deus - Porto Alegre, Presente',
        },
        {
          title: 'Farmacêutica Hospitalar',
          description: ``,
          schoolPlaceDate: 'Hospital de Alvorada - Alvorada, 2023',
        },
        {
          title: 'Farmacêutica Hospitalar',
          description: ``,
          schoolPlaceDate: 'Hospital Vila Nova - Porto Alegre, 2022',
        },
        {
          title: 'Farmacêutica Responsável Técnica',
          description: ``,
          schoolPlaceDate: 'Droga Raia - Porto Alegre, 2019-2022',
        },
        {
          title: 'Estágio no Setor PD&I Analítico - Estabilidade',
          description: ``,
          schoolPlaceDate: 'Indústria Farmacêutica Prati-Donaduzzi - Toledo, PR, 2018',
        },
        {
          title: 'Iniciação Científica em Nanotecnologia',
          description: ``,
          schoolPlaceDate:
            'Laboratório de Nanotecnologia (UFSM) - Santa Maria, 2014-2017',
        },
      ],
    },
  ],
};

export default glmachadoCVData;
