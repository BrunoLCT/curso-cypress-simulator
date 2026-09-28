# language: pt
Funcionalidade: US 05 — Bloqueio por faixa etária (Siga Internação)

  @CT40 @alta @pendente-refinamento @D2
  Cenário: Desabilitar opção e exibir tooltip
    Dado que a especialidade detalhe possui faixa etária parametrizada
    E que o paciente está fora dessa faixa
    Quando o médico acessa "Exames, procedimentos e pareceres" > Parecer Médico
    Então a opção aparece na lista com o checkbox desabilitado
    E ao passar o cursor aparece "Desabilitado para a faixa etária desse paciente"
    E o tooltip aparece apenas sobre essa opção

  @CT41 @alta
  Esquema do Cenário: Manter a opção habilitada
    Dado que <situação>
    Quando o médico acessa a tela de Solicitação de Pareceres
    Então a opção está habilitada e selecionável

    Exemplos:
      | situação                                              |
      | a especialidade tem faixa etária e o paciente está dentro |
      | a especialidade não tem faixa etária parametrizada    |

  @CT42 @media
  Cenário: Recalcular a idade ao abrir a tela
    Dado que o paciente completa a idade máxima da faixa hoje
    Quando o médico abre a tela de solicitação de pareceres
    Então a opção reflete a idade do dia da exibição

