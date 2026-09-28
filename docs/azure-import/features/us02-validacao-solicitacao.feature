# language: pt
Funcionalidade: US 02 — Validação de multiplicidade e faixa etária na solicitação

  @CT13 @alta
  Cenário: Permitir solicitação sem restrições
    Dado que não existe parecer recente da especialidade dentro do intervalo
    E que a idade do paciente está dentro da faixa etária configurada
    Quando o médico seleciona a opção de teleparecer/parecer presencial
    Então o sistema permite a solicitação normalmente

  @CT14 @alta @pendente-refinamento @D5
  Cenário: Bloquear por parecer recente
    Dado que existe parecer da mesma especialidade detalhe dentro do intervalo configurado
    Quando o médico seleciona a opção de teleparecer/parecer presencial
    Então é exibida modal "ATENÇÃO! ESSE PARECER JÁ FOI SOLICITADO."
    E o texto informa a data da solicitação anterior
    E informa "Será possível solicitar um novo parecer em: Xh Ymin"
    E lista os pareceres da mesma especialidade com formato, especialidade, solicitado em, solicitante, status e botão "Abrir parecer"

  @CT15 @alta @pendente-refinamento @D5 @D6
  Cenário: Exibir tooltip com motivo e tempo restante
    Dado que a opção está bloqueada por parecer recente
    Quando o médico passa o mouse sobre a opção
    Então o tooltip exibe o motivo do bloqueio
    E exibe o tempo restante no formato "Xh Ymin"

  @CT16 @alta
  Esquema do Cenário: Validar a virada do intervalo
    Dado que o intervalo configurado é de 24 horas
    E que o parecer anterior foi solicitado há <tempo>
    Quando o médico abre a Solicitação de Pareceres
    Então a opção está <estado>
    E o tempo restante exibido é <restante>

    Exemplos:
      | tempo     | estado       | restante |
      | 23h 59min | bloqueada    | 0h 1min  |
      | 24h 00min | habilitada   | -        |
      | 24h 01min | habilitada   | -        |

  @CT17 @alta @pendente-refinamento @D2
  Cenário: Desabilitar opção fora da faixa etária
    Dado que a idade do paciente está fora da faixa etária da especialidade detalhe
    Quando o médico visualiza a lista de opções
    Então a opção aparece desabilitada
    E ao passar o mouse aparece "Especialidade não disponível para a faixa etária do paciente"

  @CT18 @alta @pendente-refinamento @D7
  Esquema do Cenário: Validar limites de idade
    Dado que a faixa etária é de <mín> a <máx>
    E que o paciente possui <idade>
    Quando o médico abre a Solicitação de Pareceres
    Então a opção está <estado>

    Exemplos:
      | mín     | máx     | idade             | estado       |
      | 18 anos | 59 anos | 17 anos 11 meses  | desabilitada |
      | 18 anos | 59 anos | 18 anos           | habilitada   |
      | 18 anos | 59 anos | 59 anos           | habilitada   |
      | 18 anos | 59 anos | 60 anos           | desabilitada |
      | 0 meses | 12 meses| 13 meses          | desabilitada |

  @CT19 @alta
  Esquema do Cenário: Exibir opção sem regra de faixa etária
    Dado que a especialidade detalhe x filial não possui faixa etária configurada
    E que o paciente possui <idade>
    Quando o médico visualiza a lista
    Então a opção está habilitada

    Exemplos:
      | idade   |
      | 2 dias  |
      | 10 anos |
      | 90 anos |

  @CT20 @alta @pendente-refinamento @D1
  Cenário: Não aplicar restrição temporal sem tempo mínimo
    Dado que a especialidade detalhe x filial não possui tempo mínimo configurado
    E que existe parecer recente da especialidade
    Quando o médico seleciona a opção
    Então a solicitação é permitida normalmente

  @CT21 @alta @pendente-refinamento @D3
  Cenário: Exibir modal ao atingir o limite com comportamento "Com justificativa"
    Dado que o limite de solicitações foi atingido no intervalo
    E que o comportamento parametrizado é "Com justificativa"
    Quando o médico tenta selecionar a opção bloqueada
    Então o sistema exibe modal informando o limite atingido
    E o modal apresenta os campos de justificativa e de caso clínico obrigatório
    E apresenta a quantidade já solicitada e o saldo restante

  @CT22 @alta
  Cenário: Impedir a solicitação em Trava Total
    Dado que o limite de solicitações foi atingido no intervalo
    E que o comportamento parametrizado é "Sem justificativa (Trava Total)"
    Quando o médico tenta selecionar a opção bloqueada
    Então o sistema impede completamente a solicitação
    E oferece a visualização dos pareceres anteriores respondidos
    E não permite prosseguir enquanto o intervalo não for cumprido

  @CT23 @alta @pendente-refinamento @D10
  Esquema do Cenário: Exibir e atualizar o saldo
    Dado que o limite é <limite> em <horas> horas e já foram solicitados <usados>
    Quando o médico abre a Solicitação de Pareceres
    Então é exibido "Você ainda pode solicitar <saldo> parecer(es) nas próximas <horas>h"

    Exemplos:
      | limite | horas | usados | saldo |
      | 3      | 24    | 0      | 3     |
      | 3      | 24    | 1      | 2     |
      | 3      | 24    | 3      | 0     |

  @CT24 @alta @pendente-refinamento @D4
  Cenário: Tratar parecer não respondido como pendente
    Dado que existe parecer solicitado e ainda não respondido dentro do intervalo
    Quando o médico tenta solicitar novo parecer da mesma especialidade
    Então o sistema aplica a Trava Total e bloqueia completamente a solicitação

  @CT25 @alta
  Cenário: Considerar parecer cancelado na verificação da trava
    Dado que existe parecer da especialidade cancelado dentro do intervalo
    Quando o médico seleciona a opção
    Então o sistema aplica o bloqueio da regra já existente para parecer cancelado
    E essa verificação ocorre antes das novas regras

  @CT26 @alta
  Cenário: Priorizar as travas existentes sobre as novas
    Dado que existe solicitação em andamento no mesmo atendimento
    E que a especialidade também está bloqueada pelo limite de frequência
    Quando o médico seleciona a opção
    Então prevalece o comportamento atual da trava existente
    E a mensagem das novas regras não é exibida

  @CT27 @alta
  Cenário: Contar pareceres de outros atendimentos do mesmo paciente
    Dado que o paciente teve pareceres da especialidade em outro atendimento dentro do intervalo
    Quando o médico solicita no atendimento atual
    Então a contagem considera os pareceres do prontuário do paciente

  @CT28 @media @pendente-refinamento @D8
  Cenário: Exibir motivo com mais de um bloqueio
    Dado que a opção está bloqueada por parecer recente
    E que a idade do paciente está fora da faixa etária
    Quando o médico passa o mouse sobre a opção
    Então o tooltip exibe o motivo conforme a precedência definida pelo PO

  @CT29 @alta @pendente-refinamento @D11
  Cenário: Registrar tentativa de solicitação bloqueada
    Dado que o médico tentou solicitar uma opção bloqueada
    Quando consulto o log de auditoria
    Então há registro da tentativa com usuário, paciente, especialidade detalhe e data/hora

