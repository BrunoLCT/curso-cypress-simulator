# Análise QA — Trava na solicitação de parecer (EF LECOM 1276695, US 850981)

Fonte: PDF "Trava na solicitação de parecer — Siga Emergência e Siga Internação" (v1.2, 33 páginas, 8 USs), incluindo protótipos e a tela T41TRAVA. Documento interno: **não commitar/publicar** este arquivo em repositório público.

Legenda: prioridade **[A]** alta, **[M]** média, **[B]** baixa · ⚠ = depende de dúvida de refinamento (ver seção 6).

---

# Etapa 1 — Análise do requisito

## 1. Objetivo funcional
Controlar a multiplicidade de solicitações de teleparecer/parecer presencial no SIGA (Emergência e Internação) com regras **parametrizáveis por especialidade detalhe × filial** na tela **T41TRAVA**: tempo mínimo entre solicitações, limite de frequência (quantidade + intervalo, com comportamento "Com justificativa" ou "Sem justificativa/Trava Total"), faixa etária e lembrete de parecer recente com "ciente". O médico vê as opções bloqueadas, o motivo, o tempo restante e o saldo.

## 2. Escopo por US
| US | Tema | Produto |
|---|---|---|
| 01 | Parametrização na T41TRAVA (tempo, quantidade, faixa etária, limite, histórico) | Administração |
| 02 | Validação de multiplicidade e faixa etária na solicitação | SAMWeb (Emergência e Internação) |
| 03 | Modal de justificativa e caso clínico | SAMWeb (Emergência) |
| 04 | Visualização de pareceres anteriores (Trava Total) | SAMWeb (Emergência) |
| 05 | Bloquear opção fora da faixa etária | Internação |
| 06 | Bloqueio ao atingir limite (Trava Total) | Solicitação de pareceres |
| 07 | Solicitação com justificativa clínica ao atingir limite | Solicitação de pareceres |
| 08 | Lembrete de parecer recente com "ciente" | Solicitação de pareceres |

## 3. Regras de negócio consolidadas
1. Tempo mínimo (horas) por especialidade detalhe × filial; **marco inicial = data/hora da solicitação** do parecer anterior (não da resposta), independente de estar respondido, pendente ou cancelado.
2. Limite de frequência = quantidade máxima + intervalo (horas) por especialidade detalhe × filial; abrange **todos os atendimentos** do paciente (prontuário).
3. Comportamento no limite: **Com justificativa** (prossegue com justificativa) ou **Sem justificativa/Trava Total** (bloqueio total, só visualiza pareceres).
4. Faixa etária: idade mínima e máxima por especialidade detalhe × filial; fora da faixa → opção desabilitada com tooltip; sem regra → habilitada para qualquer idade.
5. Sem tempo/limite configurado → sem restrição. Quantidade não definida = **0**.
6. **Ordem de validação:** travas já existentes primeiro (solicitação em andamento/pendente no mesmo atendimento; parecer cancelado) → depois tempo mínimo, limite e faixa etária.
7. Parecer cancelado é contabilizado na trava (regra existente).
8. Lembrete (US 08): janela de horas própria, independente do limite; exige checkbox "ciente"; não bloqueia; sem janela configurada → sem alerta.
9. Justificativa clínica: obrigatória, até **4000 caracteres**, vinculada à solicitação e disponível no histórico/auditoria; lista de justificativas com só as **Ativas** e "Outro" sempre ao final (texto livre obrigatório); justificativas só podem ser **inativadas**, nunca excluídas; "Outro" é nativa.
10. Todas as alterações da T41TRAVA vão para histórico (usuário, data/hora, valor anterior e atual); tentativas bloqueadas e justificativas vão para auditoria.
11. Mensagens: "Será possível solicitar um novo parecer em: Xh Ymin"; "Você ainda pode solicitar X parecer(es) nas próximas Yh"; tooltips de faixa etária (Emergência: "Especialidade não disponível para a faixa etária do paciente"; Internação: "Desabilitado para a faixa etária desse paciente").

## 4. Dependências e integrações
T41TRAVA (Oracle Forms; abas Pareceres/Pareceres Telemedicina; campos: tempo horas, T. Mín. Pedidos, Limite Pedidos, Freq. (Horas), tipo de idade A/M, Idade Mín./Máx.); cadastro do paciente (data de nascimento); histórico de pareceres (respondido/pendente/cancelado); log de auditoria e histórico de parametrização; tela administrativa de justificativas (citada, não especificada); SAMWeb Emergência e Siga Internação.

## 5. Riscos e regressão
Regressão nas travas existentes (pendente no mesmo atendimento, cancelado, Controle de Tempo geral); cálculo de tempo restante e fuso; cálculo de idade (anos/meses, aniversário); múltiplas regras simultâneas (US 02 + 06 + 07 + 08 sobre a mesma opção); desempenho ao validar toda a lista; perda de auditoria; diferença de comportamento Emergência × Internação.

## 6. ⚠ Dúvidas para refinamento (validar com os POs)
| # | Dúvida |
|---|---|
| D1 | **Sem tempo na especialidade:** RN07/Exceção 1 dizem "sem restrição", mas Obs. 2 e RN12 (US 01) dizem que vale o **Controle de Tempo geral** (48h na tela). Qual prevalece? |
| D2 | **Textos de tooltip divergem** entre Emergência ("Especialidade não disponível…") e Internação ("Desabilitado para a faixa etária desse paciente"). Unificar? |
| D3 | **US 03 × US 07:** a US 03 pede lista de justificativas (Ativas + "Outro") **e** caso clínico; a US 07 e o protótipo têm só justificativa de texto livre; a Figura 2 tem só "Descreva o caso clínico". Qual é o modal final? |
| D4 | **O que conta no limite:** US 02/T41TRAVA falam em *solicitações*; US 06 fala em pareceres *respondidos*. Pendente conta? (Exceção 3 da US 02 trata pendente como Trava Total.) Cancelado conta (RN11)? |
| D5 | **Modal × desabilitado:** RN03 diz opção bloqueada desabilitada com tooltip; Cenário 1 (US 02) diz que ao **selecionar** a opção abre modal. Bloqueio por tempo é clicável? O Cenário 1 ainda cita parecer "respondido", mas o marco é a solicitação. |
| D6 | **Tempo restante:** RN04 (US 02) manda no tooltip; US 04 RN04 manda no modal; US 04 AC7 "junto ao item bloqueado". Onde exatamente? Qual a mensagem do bloqueio por **limite de frequência** (tooltip)? |
| D7 | **Faixa etária:** limites inclusivos? Como funciona o indicador A/M (anos/meses) e recém-nascido em dias? Paciente sem data de nascimento? |
| D8 | **Precedência entre regras:** tempo × faixa etária × limite × lembrete (US 08). Qual motivo aparece no tooltip e qual modal abre primeiro? |
| D9 | **Teleparecer × parecer presencial** da mesma especialidade contam juntos no tempo/limite? |
| D10 | **Saldo:** por médico (texto US 02) ou por paciente (RN05/US 06)? O que exibir com saldo 0? "nas próximas Yh" é o intervalo total ou o restante? Na Fig. 2 aparece "apenas mais 2 pareceres nas próximas x horas". |
| D11 | **Auditoria:** campos da tentativa bloqueada (só a justificativa lista usuário, data/hora, especialidade). Registrar também o "ciente" da US 08? |
| D12 | **Escopo por produto:** US 03, 04 e 06 citam só Emergência; US 05 só Internação; US 07/08 não citam produto. A Internação recebe tudo? |
| D13 | **Figura 1** ("modal que isenta justificativa") não está no PDF: quando aparece e o que exibe? |
| D14 | **T41TRAVA:** validações de campo (negativos, idade mín > máx, horas 0), significado do valor 0 na quantidade máxima ("sem limite"?), quem é "administrador"/perfil de acesso, e tela administrativa de justificativas (não especificada). |
| D15 | **Lista de pareceres no modal:** usa "últimas 48 horas" fixo (protótipos) ou a janela parametrizada? Quais status entram (Finalizado, pendente, cancelado)? |

## 7. Cobertura sugerida
52 cenários: Happy Path 4 · Negativo/Bloqueio 15 · Limite 6 · Validação de campos 5 · Alternativo/Exceção 9 · Auditoria/Histórico 5 · Dados/Integração 5 · Regressão 3.

---

# Etapa 2 — Cenários

Prefixo de título sugerido no Azure: `[SAMWEB | EMERGÊNCIA]`, `[SAMWEB | INTERNAÇÃO]` ou `[T41TRAVA]`.

## US 01 — Parametrização (T41TRAVA)

### CT01 — Configurar tempo mínimo e quantidade máxima [A] Happy Path (US01 AC1, RN01, RN03)
```gherkin
Funcionalidade: Parametrização de travas de parecer na T41TRAVA

  Cenário: Configurar tempo mínimo e quantidade máxima por especialidade detalhe e filial
    Dado que sou um administrador com acesso à T41TRAVA
    Quando configuro tempo mínimo em horas e quantidade máxima para uma especialidade detalhe em uma filial
    E salvo a parametrização
    Então os valores ficam armazenados vinculados à combinação especialidade detalhe x filial
    E a alteração é registrada no histórico com usuário, data/hora e valores anterior e atual
```
| # | Action | Expected Result |
|---|---|---|
| 1 | Abrir a T41TRAVA, aba Pareceres Telemedicina, filtrar a filial | Lista de especialidades detalhe da filial |
| 2 | Informar tempo mínimo (ex.: 24) e quantidade máxima (ex.: 3) e salvar | Valores gravados sem erro |
| 3 | Reabrir a tela e consultar o histórico | Valores persistidos e histórico com usuário, data/hora, anterior e atual |

### CT02 — Configurar faixa etária mínima e máxima [A] Happy Path (US01 AC2, RN02)
```gherkin
  Cenário: Configurar faixa etária por especialidade detalhe e filial
    Dado que sou um administrador com acesso à T41TRAVA
    Quando defino idade mínima e idade máxima para uma especialidade detalhe em uma filial
    Então o sistema armazena a faixa etária vinculada à combinação especialidade detalhe x filial
    E a alteração é registrada no histórico
```

### CT03 — Configurar limite de frequência e comportamento [A] Happy Path (US01 AC3, RN04, RN06) ⚠D4
```gherkin
  Esquema do Cenário: Configurar limite de frequência com comportamento ao atingir
    Dado que sou um administrador com acesso à T41TRAVA
    Quando configuro quantidade máxima <qtd>, intervalo de <horas> horas e comportamento "<comportamento>"
    Então o sistema aceita e armazena os valores
    E registra a alteração no histórico com usuário, data/hora e valores anterior e atual

    Exemplos:
      | qtd | horas | comportamento                      |
      | 3   | 24    | Com justificativa                  |
      | 2   | 48    | Sem justificativa (Trava Total)    |
```

### CT04 — Histórico de alterações [A] Auditoria (US01 RN03)
```gherkin
  Cenário: Registrar histórico de todas as alterações da parametrização
    Dado que uma especialidade detalhe possui tempo mínimo 24 configurado
    Quando altero o tempo mínimo para 48 e a faixa etária máxima
    Então o histórico exibe um registro por campo alterado
    E cada registro contém usuário, data/hora, valor anterior e valor atual
```

### CT05 — Quantidade não definida assume "0" [M] Dados (Obs. 1) ⚠D14
```gherkin
  Cenário: Assumir 0 quando a quantidade não é informada
    Dado que sou um administrador na T41TRAVA
    Quando salvo uma especialidade detalhe sem informar a quantidade máxima
    Então o campo é gravado com o valor 0
```

### CT06 — Sem tempo nem limite: sem restrição [A] Alternativo (US01 AC4, RN07)
```gherkin
  Cenário: Permitir solicitação sem parametrização de tempo ou limite
    Dado que a especialidade detalhe x filial não possui tempo mínimo nem limite de frequência
    Quando o médico solicita teleparecer dessa especialidade
    Então o sistema permite a solicitação normalmente, sem restrição
```

### CT07 — Fallback para o Controle de Tempo geral [A] Alternativo (Obs. 2, RN12) ⚠D1
```gherkin
  Cenário: Usar o Controle de Tempo geral quando a especialidade não tem tempo
    Dado que a especialidade detalhe não possui tempo parametrizado
    E que o Controle de Tempo geral é de 48 horas
    E que existe solicitação da especialidade há 10 horas
    Quando o médico tenta solicitar novamente
    Então o sistema considera o tempo de 48 horas do Controle de Tempo geral
```
Resultado depende da resolução da D1 (conflito com RN07).

### CT08 — Marco inicial da contagem é a solicitação [A] Dados (US01 AC5, RN10; US02 Cen. 9, RN12)
```gherkin
  Esquema do Cenário: Contar o tempo a partir da data/hora da solicitação
    Dado que o tempo mínimo é de 24 horas
    E que existe parecer solicitado às 08:00 com status <status>
    E que foi respondido/cancelado às 20:00
    Quando o médico consulta a opção às 10:00 do mesmo dia
    Então o tempo restante exibido é "22h 0min" contado a partir das 08:00

    Exemplos:
      | status    |
      | Finalizado |
      | Pendente  |
      | Cancelado |
```
| # | Action | Expected Result |
|---|---|---|
| 1 | Criar parecer às 08:00 e mudar o status conforme a linha | Parecer com o status da linha |
| 2 | Abrir a lista de opções às 10:00 | Opção bloqueada |
| 3 | Ler o tempo restante | "22h 0min" (não considera a data da resposta) |

### CT09 — Trava existente de solicitação em andamento no mesmo atendimento [A] Regressão (Obs. 3)
```gherkin
  Cenário: Manter a trava de solicitação em andamento no mesmo atendimento
    Dado que existe solicitação em andamento/pendente da especialidade no mesmo atendimento
    Quando o médico tenta solicitar novamente
    Então prevalece o comportamento atual do sistema (solicitação não permitida)
```

### CT10 — Valores distintos por filial [M] Dados (RN01) ⚠D14
```gherkin
  Cenário: Aplicar parametrização diferente por filial
    Dado que a filial A tem tempo mínimo de 24 horas e a filial B tem 6 horas
    E que existe parecer da especialidade há 10 horas no paciente
    Quando o médico da filial A e o médico da filial B consultam a opção
    Então na filial A a opção está bloqueada
    E na filial B a opção está habilitada
```

### CT11 — Validação de campos da T41TRAVA [M] Validação ⚠D14
```gherkin
  Esquema do Cenário: Rejeitar valores inválidos
    Dado que sou um administrador na T41TRAVA
    Quando informo <campo> = "<valor>"
    Então o sistema <resultado>

    Exemplos:
      | campo             | valor | resultado                     |
      | tempo mínimo      | -1    | rejeita o valor               |
      | quantidade máxima | abc   | rejeita o valor               |
      | idade mínima maior que a máxima | 60 / 18 | rejeita o valor |
      | tempo mínimo      | 0     | conforme definição do PO      |
```

### CT12 — Parametrizar janela do lembrete [M] Happy Path (US01 RN09; US08 RN01)
```gherkin
  Cenário: Configurar janela de horas do lembrete de parecer recente
    Dado que sou um administrador na T41TRAVA
    Quando informo a janela de horas do lembrete para uma especialidade detalhe x filial
    Então o valor é gravado de forma independente do limite de frequência
    E a alteração é registrada no histórico
```

## US 02 — Validação na solicitação (SAMWeb)

### CT13 — Solicitação permitida sem restrições [A] Happy Path (US02 AC3)
```gherkin
Funcionalidade: Validação de multiplicidade e faixa etária na solicitação

  Cenário: Permitir solicitação sem restrições
    Dado que não existe parecer recente da especialidade dentro do intervalo
    E que a idade do paciente está dentro da faixa etária configurada
    Quando o médico seleciona a opção de teleparecer/parecer presencial
    Então o sistema permite a solicitação normalmente
```
| # | Action | Expected Result |
|---|---|---|
| 1 | Abrir atendimento de paciente elegível no SIGA Emergência | Atendimento carregado |
| 2 | Abrir Solicitação de Pareceres | Opção habilitada |
| 3 | Selecionar a opção e prosseguir | Solicitação segue sem modal de trava |

### CT14 — Bloqueio por parecer recente: modal com tempo restante [A] Negativo (US02 AC1, RN01) ⚠D5
```gherkin
  Cenário: Bloquear por parecer recente
    Dado que existe parecer da mesma especialidade detalhe dentro do intervalo configurado
    Quando o médico seleciona a opção de teleparecer/parecer presencial
    Então é exibida modal "ATENÇÃO! ESSE PARECER JÁ FOI SOLICITADO."
    E o texto informa a data da solicitação anterior
    E informa "Será possível solicitar um novo parecer em: Xh Ymin"
    E lista os pareceres da mesma especialidade com formato, especialidade, solicitado em, solicitante, status e botão "Abrir parecer"
```
| # | Action | Expected Result |
|---|---|---|
| 1 | Preparar paciente com parecer solicitado dentro do intervalo | Dado disponível |
| 2 | Abrir Solicitação de Pareceres e selecionar a opção | Modal de trava aberto |
| 3 | Conferir texto e lista | Data da solicitação anterior, "Xh Ymin" e lista com "Abrir parecer" |

### CT15 — Tooltip e tempo restante na opção bloqueada [A] Negativo (RN03, RN04, Cen. 7) ⚠D5 ⚠D6
```gherkin
  Cenário: Exibir tooltip com motivo e tempo restante
    Dado que a opção está bloqueada por parecer recente
    Quando o médico passa o mouse sobre a opção
    Então o tooltip exibe o motivo do bloqueio
    E exibe o tempo restante no formato "Xh Ymin"
```

### CT16 — Liberação ao fim do intervalo (valor limite) [A] Limite (RN01, RN04, RN12)
```gherkin
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
```

### CT17 — Bloqueio por faixa etária [A] Negativo (US02 AC2, RN02, RN03) ⚠D2
```gherkin
  Cenário: Desabilitar opção fora da faixa etária
    Dado que a idade do paciente está fora da faixa etária da especialidade detalhe
    Quando o médico visualiza a lista de opções
    Então a opção aparece desabilitada
    E ao passar o mouse aparece "Especialidade não disponível para a faixa etária do paciente"
```

### CT18 — Valores-limite da faixa etária [A] Limite (RN02, US05 RN04) ⚠D7
```gherkin
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
```
Inclusão/exclusão dos limites sujeita à D7.

### CT19 — Sem faixa etária: qualquer idade [A] Alternativo (Exceção 2, RN08)
```gherkin
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
```

### CT20 — Sem tempo mínimo: sem restrição temporal [A] Alternativo (Exceção 1) ⚠D1
```gherkin
  Cenário: Não aplicar restrição temporal sem tempo mínimo
    Dado que a especialidade detalhe x filial não possui tempo mínimo configurado
    E que existe parecer recente da especialidade
    Quando o médico seleciona a opção
    Então a solicitação é permitida normalmente
```

### CT21 — Limite atingido, "Com justificativa": modal [A] Negativo (US02 AC4) → detalhes na US 03/07 ⚠D3
```gherkin
  Cenário: Exibir modal ao atingir o limite com comportamento "Com justificativa"
    Dado que o limite de solicitações foi atingido no intervalo
    E que o comportamento parametrizado é "Com justificativa"
    Quando o médico tenta selecionar a opção bloqueada
    Então o sistema exibe modal informando o limite atingido
    E o modal apresenta os campos de justificativa e de caso clínico obrigatório
    E apresenta a quantidade já solicitada e o saldo restante
```

### CT22 — Limite atingido, "Trava Total" [A] Negativo (US02 AC5, RN07)
```gherkin
  Cenário: Impedir a solicitação em Trava Total
    Dado que o limite de solicitações foi atingido no intervalo
    E que o comportamento parametrizado é "Sem justificativa (Trava Total)"
    Quando o médico tenta selecionar a opção bloqueada
    Então o sistema impede completamente a solicitação
    E oferece a visualização dos pareceres anteriores respondidos
    E não permite prosseguir enquanto o intervalo não for cumprido
```

### CT23 — Saldo de solicitações [A] Positivo (US02 AC6, RN08) ⚠D10
```gherkin
  Esquema do Cenário: Exibir e atualizar o saldo
    Dado que o limite é <limite> em <horas> horas e já foram solicitados <usados>
    Quando o médico abre a Solicitação de Pareceres
    Então é exibido "Você ainda pode solicitar <saldo> parecer(es) nas próximas <horas>h"

    Exemplos:
      | limite | horas | usados | saldo |
      | 3      | 24    | 0      | 3     |
      | 3      | 24    | 1      | 2     |
      | 3      | 24    | 3      | 0     |
```
Depois de uma nova solicitação, reabrir a tela e verificar que o saldo diminuiu em 1. Saldo 0 sujeito à D10.

### CT24 — Parecer pendente aplica Trava Total [A] Negativo (Exceção 3) ⚠D4
```gherkin
  Cenário: Tratar parecer não respondido como pendente
    Dado que existe parecer solicitado e ainda não respondido dentro do intervalo
    Quando o médico tenta solicitar novo parecer da mesma especialidade
    Então o sistema aplica a Trava Total e bloqueia completamente a solicitação
```

### CT25 — Parecer cancelado conta na trava [A] Negativo (US02 Cen. 8, Exceção 4, RN11)
```gherkin
  Cenário: Considerar parecer cancelado na verificação da trava
    Dado que existe parecer da especialidade cancelado dentro do intervalo
    Quando o médico seleciona a opção
    Então o sistema aplica o bloqueio da regra já existente para parecer cancelado
    E essa verificação ocorre antes das novas regras
```

### CT26 — Ordem de validação: trava existente prevalece [A] Regressão (RN10)
```gherkin
  Cenário: Priorizar as travas existentes sobre as novas
    Dado que existe solicitação em andamento no mesmo atendimento
    E que a especialidade também está bloqueada pelo limite de frequência
    Quando o médico seleciona a opção
    Então prevalece o comportamento atual da trava existente
    E a mensagem das novas regras não é exibida
```

### CT27 — Limite independe do atendimento [A] Dados (US02 RN05; US01 RN05; US06 RN01)
```gherkin
  Cenário: Contar pareceres de outros atendimentos do mesmo paciente
    Dado que o paciente teve pareceres da especialidade em outro atendimento dentro do intervalo
    Quando o médico solicita no atendimento atual
    Então a contagem considera os pareceres do prontuário do paciente
```

### CT28 — Bloqueios simultâneos [M] Negativo ⚠D8
```gherkin
  Cenário: Exibir motivo com mais de um bloqueio
    Dado que a opção está bloqueada por parecer recente
    E que a idade do paciente está fora da faixa etária
    Quando o médico passa o mouse sobre a opção
    Então o tooltip exibe o motivo conforme a precedência definida pelo PO
```

### CT29 — Auditoria de tentativa bloqueada [A] Auditoria (US02 RN09) ⚠D11
```gherkin
  Cenário: Registrar tentativa de solicitação bloqueada
    Dado que o médico tentou solicitar uma opção bloqueada
    Quando consulto o log de auditoria
    Então há registro da tentativa com usuário, paciente, especialidade detalhe e data/hora
```

## US 03 — Modal de justificativa e caso clínico

### CT30 — Conteúdo da modal [A] Positivo (US03 AC1, AC2, RN01, RN04) ⚠D3
```gherkin
Funcionalidade: Modal de justificativa e caso clínico

  Cenário: Exibir a modal com limite, campos e saldo
    Dado que o limite foi atingido e o comportamento é "Com justificativa"
    Quando o médico tenta prosseguir com a solicitação
    Então a modal informa que o limite foi atingido
    E exibe a quantidade já utilizada e o saldo restante
    E exibe o campo de justificativa e o campo de caso clínico
```

### CT31 — Lista de justificativas [A] Dados (AC3, RN03)
```gherkin
  Cenário: Exibir somente justificativas ativas com "Outro" ao final
    Dado que existem justificativas Ativas e Inativas cadastradas
    Quando o médico abre a lista de justificativas
    Então somente as Ativas são exibidas
    E a opção "Outro" aparece sempre por último
```

### CT32 — Opção "Outro" [A] Validação (AC4)
```gherkin
  Cenário: Exigir texto livre ao selecionar "Outro"
    Dado a modal de justificativa aberta
    Quando o médico seleciona "Outro"
    Então é exibido campo de texto livre obrigatório
    E não é possível confirmar sem preenchê-lo
```

### CT33 — Obrigatoriedade de justificativa e caso clínico [A] Validação (AC5, AC6, RN02) ⚠D3
```gherkin
  Esquema do Cenário: Confirmar somente com os dois campos
    Dado a modal de justificativa aberta
    Quando o médico preenche justificativa "<just>" e caso clínico "<caso>"
    Então a confirmação da solicitação é <resultado>

    Exemplos:
      | just          | caso          | resultado  |
      | vazia         | vazio         | bloqueada  |
      | preenchida    | vazio         | bloqueada  |
      | vazia         | preenchido    | bloqueada  |
      | só espaços    | preenchido    | bloqueada  |
      | preenchida    | preenchido    | permitida  |
```

### CT34 — Registro em auditoria [A] Auditoria (AC7, RN05)
```gherkin
  Cenário: Registrar justificativa e caso clínico
    Dado que o médico confirmou a solicitação com justificativa e caso clínico
    Quando consulto o log de auditoria
    Então há registro com justificativa, caso clínico, usuário, data/hora e especialidade detalhe
```

### CT35 — Gestão das justificativas na tela administrativa [M] Regra (AC8, RN03) ⚠D14
```gherkin
  Esquema do Cenário: Inativar sim, excluir não
    Dado que existe uma justificativa cadastrada <tipo>
    Quando o administrador tenta <ação>
    Então o sistema <resultado>

    Exemplos:
      | tipo       | ação      | resultado          |
      | comum      | inativar  | permite            |
      | comum      | excluir   | não permite        |
      | "Outro"    | inativar  | não permite        |
      | "Outro"    | remover   | não permite        |
```

### CT36 — Modal só no comportamento "Com justificativa" [A] Negativo (RN01)
```gherkin
  Cenário: Não exibir a modal na Trava Total
    Dado que o limite foi atingido e o comportamento é "Sem justificativa (Trava Total)"
    Quando o médico tenta solicitar
    Então a modal de justificativa não é exibida
```

## US 04 — Visualização de pareceres anteriores (Trava Total)

### CT37 — Botão "Abrir parecer" e lista [A] Positivo (AC2–AC5, RN03)
```gherkin
Funcionalidade: Visualização de pareceres anteriores na Trava Total

  Cenário: Consultar pareceres anteriores em modo somente leitura
    Dado que a solicitação está em Trava Total
    Quando o médico aciona "Abrir parecer"
    Então são listados os pareceres respondidos da especialidade dentro do período
    E cada parecer exibe data e hora, nome do parecerista, CRM e conteúdo da resposta
    E a visualização é somente leitura, sem edição nem exclusão
```

### CT38 — Nova solicitação bloqueada com tempo restante [A] Negativo (AC1, AC6, AC7, RN02, RN04) ⚠D6
```gherkin
  Cenário: Manter a nova solicitação bloqueada
    Dado que a solicitação está em Trava Total
    Quando o médico tenta iniciar nova solicitação da especialidade
    Então o botão/opção permanece completamente bloqueado
    E é exibido o tempo restante no formato "Xh Ymin"
```

### CT39 — Nenhum parecer respondido no período [M] Alternativo (Exceção 1)
```gherkin
  Cenário: Informar ausência de pareceres respondidos
    Dado que o limite foi atingido apenas com pareceres pendentes
    Quando o médico tenta visualizar pareceres anteriores
    Então é exibida mensagem informando que não há pareceres anteriores disponíveis
    E a trava permanece ativa
```

## US 05 — Faixa etária na Internação

### CT40 — Opção fora da faixa etária desabilitada [A] Negativo (Cen. 1, RN02, RN03) ⚠D2
```gherkin
Funcionalidade: Bloqueio por faixa etária no Siga Internação

  Cenário: Desabilitar opção e exibir tooltip
    Dado que a especialidade detalhe possui faixa etária parametrizada
    E que o paciente está fora dessa faixa
    Quando o médico acessa "Exames, procedimentos e pareceres" > Parecer Médico
    Então a opção aparece na lista com o checkbox desabilitado
    E ao passar o cursor aparece "Desabilitado para a faixa etária desse paciente"
    E o tooltip aparece apenas sobre essa opção
```

### CT41 — Dentro da faixa e sem parametrização [A] Alternativo (Cen. 2, Cen. 3)
```gherkin
  Esquema do Cenário: Manter a opção habilitada
    Dado que <situação>
    Quando o médico acessa a tela de Solicitação de Pareceres
    Então a opção está habilitada e selecionável

    Exemplos:
      | situação                                              |
      | a especialidade tem faixa etária e o paciente está dentro |
      | a especialidade não tem faixa etária parametrizada    |
```

### CT42 — Idade calculada no momento da exibição [M] Dados (RN01)
```gherkin
  Cenário: Recalcular a idade ao abrir a tela
    Dado que o paciente completa a idade máxima da faixa hoje
    Quando o médico abre a tela de solicitação de pareceres
    Então a opção reflete a idade do dia da exibição
```

## US 06 — Bloqueio ao atingir o limite (Trava Total)

### CT43 — Alerta de limite atingido [A] Negativo (Cen. 1, RN02, RN03, RN04) ⚠D4
```gherkin
Funcionalidade: Bloqueio ao atingir o limite máximo de pareceres

  Cenário: Exibir alerta com a relação de pareceres e apenas "Voltar"
    Dado que a especialidade x filial tem limite máximo e comportamento "Sem justificativa (Trava Total)"
    E que o paciente já possui pareceres em quantidade igual ao limite no período
    Quando o médico tenta solicitar um novo teleparecer dessa especialidade
    Então o sistema exibe alerta informando que o limite foi atingido
    E lista os pareceres do período com data, hora e responsável pela resposta
    E informa o tempo faltante para nova solicitação
    E disponibiliza apenas a opção "Voltar"
```

### CT44 — Valor limite da quantidade [A] Limite (Cen. 1, Cen. 2)
```gherkin
  Esquema do Cenário: Comparar respondidos com o limite
    Dado que o limite máximo é <limite>
    E que o paciente possui <respondidos> pareceres respondidos no período
    Quando o médico solicita novo teleparecer da especialidade
    Então a solicitação é <resultado>

    Exemplos:
      | limite | respondidos | resultado  |
      | 3      | 2           | permitida  |
      | 3      | 3           | bloqueada  |
      | 3      | 4           | bloqueada  |
```

### CT45 — "Voltar" retorna sem registrar [M] Alternativo (Cen. 1)
```gherkin
  Cenário: Voltar do alerta de Trava Total
    Dado o alerta de Trava Total exibido
    Quando o médico clica em "Voltar"
    Então retorna à tela de solicitação
    E nenhuma solicitação é criada
```

## US 07 — Solicitação com justificativa clínica

### CT46 — Prosseguir com justificativa [A] Happy Path (Cen. 1, RN03, RN05)
```gherkin
Funcionalidade: Solicitação com justificativa clínica ao atingir o limite

  Cenário: Registrar a justificativa e criar o parecer
    Dado que o limite foi atingido e o comportamento é "Com justificativa"
    E o alerta exibe a lista de pareceres anteriores com data, hora e profissional
    Quando o médico preenche a justificativa clínica e clica em "Prosseguir com a solicitação"
    Então o sistema cria o parecer normalmente
    E a justificativa fica vinculada de forma permanente à solicitação
    E está disponível no histórico/auditoria do paciente
```

### CT47 — Botão desabilitado sem justificativa [A] Validação (Cen. 2, RN01)
```gherkin
  Esquema do Cenário: Manter "Prosseguir com a solicitação" desabilitado
    Dado o alerta de limite atingido com justificativa
    Quando o campo de justificativa contém "<conteúdo>"
    Então o botão "Prosseguir com a solicitação" está <estado>

    Exemplos:
      | conteúdo       | estado       |
      | (vazio)        | desabilitado |
      | apenas espaços | desabilitado |
      | texto válido   | habilitado   |
```

### CT48 — Limite de 4000 caracteres [A] Limite (RN02)
```gherkin
  Esquema do Cenário: Validar o tamanho da justificativa
    Dado o alerta de limite atingido com justificativa
    Quando o médico informa <qtd> caracteres
    Então o sistema <resultado>
    E o contador exibe <contador>

    Exemplos:
      | qtd  | resultado                 | contador  |
      | 3999 | aceita                    | 3999/4000 |
      | 4000 | aceita                    | 4000/4000 |
      | 4001 | impede a digitação/colagem além de 4000 | 4000/4000 |
```

### CT49 — "Voltar" não registra nada [M] Alternativo (Cen. 3)
```gherkin
  Cenário: Desistir de prosseguir
    Dado o alerta de limite atingido com justificativa
    Quando o médico clica em "Voltar"
    Então retorna à tela de solicitação de pareceres
    E não registra nova solicitação nem justificativa
```

### CT50 — Fluxo só no comportamento "Com justificativa" [A] Negativo (RN04)
```gherkin
  Cenário: Não exibir a exceção quando o comportamento é Trava Total
    Dado que o limite foi atingido e o comportamento é "Sem justificativa (Trava Total)"
    Quando o médico tenta solicitar
    Então o campo de justificativa e o botão "Prosseguir com a solicitação" não são exibidos
```

## US 08 — Lembrete de parecer recente com "ciente"

### CT51 — Lembrete com ciente obrigatório [A] Happy Path (Cen. 1, Cen. 2, RN02, RN04)
```gherkin
Funcionalidade: Lembrete de parecer recente

  Cenário: Exigir o ciente para solicitar mesmo assim
    Dado que existe parecer da especialidade dentro da janela do lembrete
    E que o limite máximo de frequência ainda não foi atingido
    Quando o médico seleciona a especialidade e tenta solicitar
    Então é exibido alerta com a data do parecer anterior
    E a lista dos demais pareceres da janela com data, hora e profissional
    E o checkbox "Estou ciente dos pareceres anteriores e reconheço a necessidade clínica de uma nova solicitação para este paciente."
    E o botão "Solicitar mesmo assim" está desabilitado até marcar o checkbox
    Quando o médico marca o checkbox e clica em "Solicitar mesmo assim"
    Então a solicitação prossegue
```
| # | Action | Expected Result |
|---|---|---|
| 1 | Preparar parecer dentro da janela do lembrete | Dado disponível |
| 2 | Selecionar a especialidade e solicitar | Alerta com data e lista de pareceres |
| 3 | Verificar o botão "Solicitar mesmo assim" | Desabilitado |
| 4 | Marcar o checkbox e clicar no botão | Solicitação criada |

### CT52 — Sem parecer na janela / janela não parametrizada [A] Alternativo (Cen. 3, Cen. 4, RN03)
```gherkin
  Esquema do Cenário: Não exibir o lembrete
    Dado que <situação>
    Quando o médico solicita a especialidade
    Então o alerta de lembrete não é exibido
    E a solicitação segue normalmente

    Exemplos:
      | situação                                                                 |
      | não existe parecer da especialidade dentro da janela do lembrete          |
      | a especialidade x filial não possui janela do lembrete parametrizada      |
```

### CT53 — Independência entre janela do lembrete e limite [M] Dados (RN01) ⚠D8
```gherkin
  Cenário: Janela do lembrete diferente do intervalo do limite
    Dado que a janela do lembrete é de 12 horas e o intervalo do limite é de 48 horas
    E que existe parecer há 20 horas
    Quando o médico solicita a especialidade
    Então o lembrete não é exibido
    E a contagem do limite considera as 48 horas
```

### CT54 — "Voltar" no lembrete [B] Alternativo
```gherkin
  Cenário: Voltar sem solicitar
    Dado o alerta de lembrete exibido
    Quando o médico clica em "Voltar"
    Então retorna à tela de solicitação sem criar parecer
```

## Regressão

### CT55 — Fluxo existente de solicitação de parecer [A] Regressão
```gherkin
  Cenário: Manter o fluxo de solicitação em especialidades não parametrizadas
    Dado uma especialidade sem nenhuma parametrização nova
    Quando o médico solicita o parecer
    Então o fluxo atual segue inalterado
```
Fora do escopo declarado: especialidades sem parametrização, relatórios/painéis e regras de autorização de teleconsulta.

### CT56 — Desempenho da lista com validação por opção [B] Não funcional
```gherkin
  Cenário: Abrir a lista com todas as regras ativas
    Dado uma filial com muitas especialidades parametrizadas
    Quando o médico abre a Solicitação de Pareceres
    Então a lista carrega em tempo aceitável, com cada opção validada
```
Critério de tempo não definido: solicitar ao PO/Arquitetura.

---

# Etapa 3 — Matriz de rastreabilidade

| Origem | Cenários |
|---|---|
| US01 AC1 / RN01 | CT01, CT10 |
| US01 AC2 / RN02 | CT02, CT18 |
| US01 AC3 / RN04 / RN06 | CT03 |
| US01 AC4 / RN07 / RN08 | CT06, CT19 |
| US01 AC5 / RN10 | CT08 |
| US01 RN03 (histórico) | CT01, CT04 |
| US01 RN09 / Obs. 1–3, RN12 | CT05, CT07, CT09, CT12 |
| US02 AC1 / RN01 | CT14, CT16 |
| US02 AC2 / RN02 / RN03 | CT17, CT18, CT28 |
| US02 AC3 | CT13 |
| US02 AC4 / AC5 | CT21, CT22 |
| US02 AC6 / RN08 | CT23 |
| US02 Cen. 7 / 8 / 9 | CT15, CT25, CT08 |
| US02 RN04 / RN05 / RN09–RN12 | CT15, CT16, CT27, CT29, CT26, CT25, CT08 |
| US02 Exceções 1–4 | CT20, CT19, CT24, CT25 |
| US03 AC1–AC8 / RN01–RN05 | CT30–CT36 |
| US04 AC1–AC7 / RN01–RN04 / Exceção 1 | CT22, CT37, CT38, CT39 |
| US05 Cen. 1–3 / RN01–RN04 | CT40, CT41, CT42, CT18 |
| US06 Cen. 1–2 / RN01–RN04 | CT43, CT44, CT45, CT27 |
| US07 Cen. 1–3 / RN01–RN05 | CT46, CT47, CT48, CT49, CT50 |
| US08 Cen. 1–4 / RN01–RN04 | CT51, CT52, CT53, CT54 |

Todos os critérios de aceite e regras de cada US têm ao menos um cenário.

**Faltam cenários?** Sim: (1) fluxo do modal "que isenta justificativa" (Figura 1 ausente, D13); (2) mensagem/tooltip do bloqueio por limite de frequência (D6); (3) interação entre US 02, 06, 07 e 08 na mesma opção (D8), hoje coberta só por CT28 e CT53; (4) permissões por perfil (médico solicitante x administrador; D14); (5) desempenho e acessibilidade do tooltip por teclado; (6) comparação de textos e comportamento entre Emergência e Internação (D2, D12).

---

## Próximos passos
- Levar as dúvidas D1 a D15 ao PO (Anne Karolyne Maia, Emergência; André Carvalho, Internação) antes de fechar os resultados esperados marcados com ⚠.
- Priorizar a execução por [A] alta e pelos cenários sem ⚠.
