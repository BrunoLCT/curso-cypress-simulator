# DESCOBERTA-AMBIENTE

**Status: AINDA NÃO EXECUTADO no Azure real.**

Este arquivo será **sobrescrito** pelo comando de descoberta da Fase 1 (`azure-qa-copilot/`, ver o README), com o que for encontrado no seu ambiente e a comparação com as hipóteses A1–A10 da Fase 0.

O ambiente onde a ferramenta foi escrita não alcança o Azure DevOps, então **nenhum dado real foi coletado**. A ferramenta foi verificada apenas contra um Azure simulado com dados sintéticos.

Para gerar:
```bash
cd azure-qa-copilot && npm install && cp .env.example .env
npm run discover -- --work-item <ID> --plan <ID> --suite <ID> --mask
```
Depois de rodar, revise o arquivo antes de compartilhar ou commitar. **Não** iniciar geração de cenários nem escrita no Azure antes dessa revisão.
