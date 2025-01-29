import { CVData, Icons } from './SimpleCVTypes';

const CVLinks = {
  linkedin: 'https://www.linkedin.com/in/s%C3%ADlvia-lunardi-remuzzi-b15059168/',
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
        },
        {
          title: 'Graduação em Farmácia',
          schoolPlaceDate: 'UFSM - Santa Maria, RS. 2013-2018',
        },
        {
          title: 'Pós-graduação em Farmácia Clínica e Atenção Farmacêutica',
          schoolPlaceDate: 'Estácio de Sá - Porto Alegre, 2021',
        },
      ],
    },
    {
      title: 'Experiências',
      fields: [
        {
          title: 'Residência em Atenção ao Paciente Crítico',
          description: `
            Atuação nos seguintes setores do Hospital Nossa Senhora da Conceição: Unidade de Terapia Intensiva (UTI) adulto, Emergência, Comissão de Medicamentos (COMEDI), Programa de Atenção Domiciliar (PAD), Comissão de Controle de Infecção Hospitalar (CCIH), Centro de Onco-Hematologia e Cuidados Paliativos; Atuação na UTI do Hospital Cristo Redentor.
 Avaliação de prescrições médicas de pacientes; Participação em rounds multiprofissionais; Atualização da tabela de compatibilidade para administração de medicamentos em Y; Validação de medicamentos próprios do paciente. Experiência com Micromedex IV Compatibility®, Lexicomp®, UpToDate®, VancoCalc®.
          `,
          schoolPlaceDate: 'GHC - Porto Alegre, 2023-Presente',
        },
        {
          title: 'Estágio em Farmácia Satélite da UTI',
          description: `Cargo: Estagiária curricular na farmácia da UTI, e breve passagem pelas farmácias do bloco cirúrgico e emergência.
           Farmácia clínica; Participação em rounds multiprofissionais; Acompanhamento da dispensação de medicamentos e materiais e montagem de lotes; Acompanhamento da elaboração da escala dos auxiliares de farmácia e ajuste do ponto. Experiência com NoHarm.ai e Tasy®.
          `,
          schoolPlaceDate: 'Hospital Ernesto Dornelles - Porto Alegre, 2024',
        },
        {
          title: 'Estágio em Farmácia Satélite da UTI',
          description: ``,
          schoolPlaceDate: 'Hospital Mãe de Deus - Porto Alegre, Presente',
        },
        {
          title: 'Farmacêutica Hospitalar',
          description: `
           Dispensação de medicamentos e materiais; Avaliação de prescrições médicas; Suporte técnico para equipe multiprofissional.
          `,
          schoolPlaceDate: 'Hospital de Alvorada - Alvorada, 2023',
        },
        {
          title: 'Farmacêutica Hospitalar',
          description: `
           Dispensação de medicamentos e materiais; Avaliação de prescrições médicas de pacientes internados Suporte técnico para médicos, enfermeiros e técnicos de enfermagem frente a dúvidas relacionadas aos medicamentos; Elaboração de escala de atividades dos auxiliares da farmácia, assim como liderança dos mesmos; Experiência com o SIGH - Sistema Integrado de Gestão Hospitalar. 
          `,
          schoolPlaceDate: 'Hospital Vila Nova - Porto Alegre, 2022',
        },
        {
          title: 'Farmacêutica Responsável Técnica',
          description: `
           Dispensação de medicamentos; Gerenciamento da entrada e saída de medicamentos sujeitos a controle especial; Controle da validade dos produtos; Escrituração de prescrições; Treinamento continuado de novos farmacêuticos, estagiária e da equipe; Realização de testes rápidos de Covid-19; Aplicação de medicamentos injetáveis.
          `,
          schoolPlaceDate: 'Droga Raia - Porto Alegre, 2019-2022',
        },
        {
          title: 'Estágio no Setor PD&I Analítico - Estabilidade',
          description: ``,
          schoolPlaceDate: 'Prati, Donaduzzi e CIA LTDA - Toledo, PR, 2018',
        },
        {
          title: 'Bolsista de Iniciação Científica',
          description: ``,
          schoolPlaceDate:
            'Laboratório de Desenvolvimento Farmacotécnico - UFSM - Santa Maria, 2015-2018',
        },
      ],
    },
  ],
};

export default glmachadoCVData;
