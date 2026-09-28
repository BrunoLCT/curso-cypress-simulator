# language: pt
Funcionalidade: US 04 — Visualização de pareceres anteriores (Trava Total)

  @CT37 @alta
  Cenário: Consultar pareceres anteriores em modo somente leitura
    Dado que a solicitação está em Trava Total
    Quando o médico aciona "Abrir parecer"
    Então são listados os pareceres respondidos da especialidade dentro do período
    E cada parecer exibe data e hora, nome do parecerista, CRM e conteúdo da resposta
    E a visualização é somente leitura, sem edição nem exclusão

  @CT38 @alta @pendente-refinamento @D6
  Cenário: Manter a nova solicitação bloqueada
    Dado que a solicitação está em Trava Total
    Quando o médico tenta iniciar nova solicitação da especialidade
    Então o botão/opção permanece completamente bloqueado
    E é exibido o tempo restante no formato "Xh Ymin"

  @CT39 @media
  Cenário: Informar ausência de pareceres respondidos
    Dado que o limite foi atingido apenas com pareceres pendentes
    Quando o médico tenta visualizar pareceres anteriores
    Então é exibida mensagem informando que não há pareceres anteriores disponíveis
    E a trava permanece ativa

