# language: pt
Funcionalidade: Regressão e não funcional

  @CT55 @alta
  Cenário: Manter o fluxo de solicitação em especialidades não parametrizadas
    Dado uma especialidade sem nenhuma parametrização nova
    Quando o médico solicita o parecer
    Então o fluxo atual segue inalterado

  @CT56 @baixa
  Cenário: Abrir a lista com todas as regras ativas
    Dado uma filial com muitas especialidades parametrizadas
    Quando o médico abre a Solicitação de Pareceres
    Então a lista carrega em tempo aceitável, com cada opção validada

