# NO SAVE — vitrine estática

Loja pública da NO SAVE (streetwear, Boa Esperança – MG) — vitrine estática no GitHub Pages,
com o artefato `no-save` como sistema de registro. Custo fixo: R$ 0/mês.

## O que é publicado

- Home, catálogo (6 produtos, 11 variantes), 6 páginas de produto, carrinho, checkout,
  página do pedido, Sobre, Trocas, Entrega, Privacidade, Contato, Termos e FAQ.
- Fotos reais dos produtos (do artefato), logo original e guia de medidas aprovado.
- Preços: camisetas R$ 59, bonés R$ 49. Pagamento só Pix ou dinheiro, confirmação manual.
- Entrega local em Boa Esperança – MG, sem taxa por enquanto. Retirada desligada.

## O que NÃO está neste repositório (de propósito)

- **Nenhum número de WhatsApp.** Os números dos sócios não aparecem em nenhuma página
  nem em nenhum arquivo. A finalização por WhatsApp está pendente — ver PENDENCIAS.md.
- Nenhuma chave Pix, senha, token ou segredo. Não há segredo nenhum nesta fase.
- Nenhum dado de cliente. O carrinho vive no navegador do cliente (localStorage).

## Como re-exportar o catálogo

1. No `/admin` do artefato, confira o estoque físico e atualize produtos/preços.
2. Gere novamente `catalogo.json` e `config.json` a partir do `getStorefront`.
3. Rode `build.py` neste diretório e suba os arquivos gerados em `site/`.
4. O rodapé mostra "Catálogo atualizado em DD/MM/AAAA" — atualize a data a cada exportação.

## Fotos

As fotos são as fotos reais do artefato, otimizadas (máx. 1000 px, JPEG q82) e embutidas
como data URI nas páginas, porque o conector do GitHub não envia arquivos binários.
Nenhuma foto foi gerada por IA e nenhuma foto é de outro produto.

## Endereço provisório (quando o Pages for ativado)

https://vitorhugobar3840-tech.github.io/no-save/

O domínio nosave.com.br fica para a fase nacional (Fase D) — bloqueado por idade hoje.
