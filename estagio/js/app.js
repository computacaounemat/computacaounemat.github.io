/*
  Guia do Estágio Supervisionado — UNEMAT
  app.js — orquestração geral: carrega os dados de data/*.json, renderiza o
  conteúdo dinâmico (documentos, FAQ, legislação, papéis, áreas, fundamentos
  normativos) e liga os controles da página inicial, da regularização e do
  fluxo de convalidação.
*/

(function () {
  "use strict";

  var AVISO_SEM_STORAGE_PADRAO =
    "Seu navegador não permite salvar o progresso localmente. O Guia continua funcionando, " +
    "mas suas marcações não serão preservadas ao recarregar a página.";
  var AVISO_REINICIAR_PADRAO =
    "Isso apagará apenas as marcações deste Guia armazenadas neste navegador. Nenhum registro acadêmico será afetado.";

  var TIPO_LABEL = { norma: "Obrigatório pela norma", procedimento: "Procedimento do curso", orientacao: "Orientação do guia" };
  var TIPO_CLASSE = { norma: "badge-norma", procedimento: "badge-procedimento", orientacao: "badge-orientacao" };

  function escapar(texto) {
    var div = document.createElement("div");
    div.textContent = texto == null ? "" : String(texto);
    return div.innerHTML;
  }

  function fundamentoHtml(fundamento) {
    if (!fundamento) {
      return '<p class="texto-secundario">Fundamento normativo específico não disponível nos documentos fornecidos.</p>';
    }
    return (
      '<div class="fundamento-item">' +
      '<span class="badge-tipo ' + (TIPO_CLASSE[fundamento.tipo] || "badge-orientacao") + '">' +
      (TIPO_LABEL[fundamento.tipo] || "Orientação do guia") +
      "</span>" +
      "<p><strong>" + escapar(fundamento.documento) + "</strong>" +
      (fundamento.artigo ? " — " + escapar(fundamento.artigo) : "") +
      "</p>" +
      "<p>" + escapar(fundamento.texto) + "</p>" +
      "</div>"
    );
  }

  function renderFundamentos(conteudo) {
    document.querySelectorAll('[data-render="fundamento"][data-fundamento-key]').forEach(function (el) {
      var chave = el.getAttribute("data-fundamento-key");
      el.innerHTML = fundamentoHtml(conteudo.fundamentos[chave]);
    });
  }

  function renderPapeis(conteudo) {
    document.querySelectorAll('[data-render="papeis"]').forEach(function (container) {
      container.innerHTML = conteudo.papeis
        .map(function (p) {
          var fundamento = p.fundamento ? conteudo.fundamentos[p.fundamento] : null;
          var citacao = fundamento
            ? '<p class="texto-secundario"><em>' + escapar(fundamento.documento) +
              (fundamento.artigo ? ", " + escapar(fundamento.artigo) : "") + "</em></p>"
            : "";
          return '<article class="card"><h4>' + escapar(p.nome) + "</h4><p>" + escapar(p.descricao) + "</p>" + citacao + "</article>";
        })
        .join("");
    });
  }

  function renderAreas(conteudo) {
    var container = document.getElementById("cards-areas");
    var detalhe = document.getElementById("area-detalhe");
    if (!container || !detalhe) return;
    container.innerHTML = conteudo.areas
      .map(function (area) {
        return (
          '<button type="button" class="card card-area" data-area-id="' + area.id + '" aria-pressed="false">' +
          "<h4>" + escapar(area.nome) + "</h4></button>"
        );
      })
      .join("");
    container.querySelectorAll("[data-area-id]").forEach(function (botao) {
      botao.addEventListener("click", function () {
        container.querySelectorAll("[data-area-id]").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        botao.setAttribute("aria-pressed", "true");
        var area = conteudo.areas.filter(function (a) { return a.id === botao.getAttribute("data-area-id"); })[0];
        if (!area) return;
        detalhe.innerHTML =
          "<h4>" + escapar(area.nome) + "</h4><p>" + escapar(area.descricao) + "</p>" +
          '<p class="texto-secundario">' + escapar(conteudo.areasTextoOficial) + "</p>";
        detalhe.classList.remove("is-hidden");
      });
    });
  }

  function renderFaq(lista, conteudo) {
    var container = document.getElementById("lista-faq");
    if (!container) return;
    container.innerHTML = lista
      .map(function (item, indice) {
        var idResposta = "faq-resp-" + indice;
        var fundamento = item.fundamento ? conteudo.fundamentos[item.fundamento] : null;
        return (
          '<div class="faq-item"><h3><button type="button" class="faq-pergunta" aria-expanded="false" aria-controls="' +
          idResposta + '">' + escapar(item.pergunta) + "</button></h3>" +
          '<div id="' + idResposta + '" class="faq-resposta" hidden><p>' + escapar(item.resposta) + "</p>" +
          (fundamento ? fundamentoHtml(fundamento) : "") + "</div></div>"
        );
      })
      .join("");
  }

  function renderLegislacao(lista) {
    var container = document.getElementById("lista-legislacao");
    if (!container || !lista) return;
    container.innerHTML = lista
      .map(function (item) {
        var partes = [];
        partes.push('<article class="card' + (item.disponivel ? "" : " card-indisponivel") + '">');
        partes.push("<h3>" + escapar(item.titulo) + "</h3>");
        partes.push("<p>" + escapar(item.descricao) + "</p>");
        if (item.disponivel) {
          partes.push('<a class="botao botao-outline" href="' + escapar(item.arquivo) + '" target="_blank" rel="noopener">Consultar documento</a>');
        } else {
          partes.push('<p class="card-indisponivel-aviso">Arquivo ainda não disponibilizado.</p>');
          if (item.observacao) partes.push('<p class="texto-secundario">' + escapar(item.observacao) + "</p>");
        }
        partes.push("</article>");
        return partes.join("");
      })
      .join("");
  }

  function renderContatoRodape(conteudo) {
    var sigaa = document.getElementById("texto-sigaa");
    if (sigaa) {
      sigaa.innerHTML = conteudo.links.sigaaUrl
        ? '<a href="' + escapar(conteudo.links.sigaaUrl) + '" target="_blank" rel="noopener">Acessar SIGAA</a>'
        : "Link ainda não configurado.";
    }
    var professor = document.getElementById("texto-professor-supervisor");
    if (professor) professor.textContent = (conteudo.avisos && conteudo.avisos.professorSupervisor) || "";

    var atualizacao = document.getElementById("rodape-ultima-atualizacao");
    if (atualizacao) atualizacao.textContent = "Última atualização do Guia: " + ((conteudo.rodape && conteudo.rodape.ultimaAtualizacao) || "");
    var base = document.getElementById("rodape-base-normativa");
    if (base) base.textContent = "Base normativa considerada: " + ((conteudo.rodape && conteudo.rodape.baseNormativa) || []).join(" · ");
  }

  function mostrarAvisoStorageSeNecessario() {
    var aviso = document.getElementById("aviso-sem-storage");
    if (!aviso) return;
    if (!window.GuiaStorage.isAvailable()) {
      aviso.textContent = AVISO_SEM_STORAGE_PADRAO;
      aviso.classList.remove("is-hidden");
    }
  }

  function marcarJornadaEscolhida(jornada) {
    document.querySelectorAll("[data-jornada-card]").forEach(function (card) {
      var ativa = card.getAttribute("data-jornada-card") === jornada;
      card.classList.toggle("is-escolhida", ativa);
      var badgeExistente = card.querySelector(".card-badge-escolha");
      if (ativa && !badgeExistente) {
        var badge = document.createElement("p");
        badge.className = "card-badge-escolha";
        badge.textContent = "Sua escolha";
        card.insertBefore(badge, card.firstChild);
      } else if (!ativa && badgeExistente) {
        badgeExistente.remove();
      }
    });
  }

  function atualizarPressedGrupo(seletor, atributo, valorAtual) {
    document.querySelectorAll(seletor).forEach(function (botao) {
      botao.setAttribute("aria-pressed", String(botao.getAttribute(atributo) === valorAtual));
    });
  }

  function aplicarLocalEstagio(valor) {
    document.querySelectorAll(".regularizacao-bloco[data-local]").forEach(function (bloco) {
      bloco.classList.toggle("is-hidden", bloco.getAttribute("data-local") !== valor);
    });
    var vazio = document.querySelector("[data-regularizacao-vazio]");
    if (vazio) vazio.classList.toggle("is-hidden", !!valor);
    atualizarPressedGrupo("[data-escolher-local]", "data-escolher-local", valor);
    if (window.Progresso) window.Progresso.recalcular();
  }

  function restaurarEstadoVisual() {
    var estado = window.GuiaStorage.getState();
    if (estado.jornada) marcarJornadaEscolhida(estado.jornada);
    if (estado.localPretendido) {
      atualizarPressedGrupo("[data-escolher-local-pretendido]", "data-escolher-local-pretendido", estado.localPretendido);
    }
    if (estado.localEstagio) aplicarLocalEstagio(estado.localEstagio);
  }

  function abrirModalConfirmacao(texto, aoConfirmar) {
    var modal = document.getElementById("modal-confirmacao");
    var textoEl = document.getElementById("modal-confirmacao-texto");
    var confirmarBtn = document.getElementById("modal-confirmacao-confirmar");
    var cancelarBtn = document.getElementById("modal-confirmacao-cancelar");
    if (!modal || !textoEl || !confirmarBtn || !cancelarBtn) return;
    textoEl.textContent = texto;
    modal.classList.remove("is-hidden");

    function limpar() {
      confirmarBtn.removeEventListener("click", onConfirmar);
      cancelarBtn.removeEventListener("click", onCancelar);
      modal.classList.add("is-hidden");
    }
    function onConfirmar() { limpar(); aoConfirmar(); }
    function onCancelar() { limpar(); }

    confirmarBtn.addEventListener("click", onConfirmar);
    cancelarBtn.addEventListener("click", onCancelar);
  }

  var ConvalidacaoFlow = {
    render: function () {
      var c = window.GuiaStorage.getState().convalidacao;
      var visiveis = {
        "1": true,
        "reprovado": c.resposta1 === false,
        "2": c.resposta1 === true,
        "bloqueio": (c.resposta1 === true && c.resposta2 === false) ||
          (c.resposta1 === true && c.resposta2 === true && c.resposta3 === false),
        "3": c.resposta1 === true && c.resposta2 === true,
        "4": c.resposta1 === true && c.resposta2 === true && c.resposta3 === true,
        "documentos": c.resposta1 === true && c.resposta2 === true && c.resposta3 === true && !!c.etapaEscolhida
      };
      Object.keys(visiveis).forEach(function (chave) {
        var el = document.querySelector('.conv-passo[data-conv-step="' + chave + '"]');
        if (el) el.classList.toggle("is-hidden", !visiveis[chave]);
      });
      document.querySelectorAll("[data-conv-resposta]").forEach(function (botao) {
        var partes = botao.getAttribute("data-conv-resposta").split(":");
        var chaveResposta = "resposta" + partes[0];
        var valorBotao = partes[1] === "sim";
        botao.setAttribute("aria-pressed", String(c[chaveResposta] === valorBotao));
      });
      document.querySelectorAll("[data-conv-etapa]").forEach(function (botao) {
        botao.setAttribute("aria-pressed", String(botao.getAttribute("data-conv-etapa") === c.etapaEscolhida));
      });
    },
    init: function () {
      document.querySelectorAll("[data-conv-resposta]").forEach(function (botao) {
        botao.addEventListener("click", function () {
          var partes = botao.getAttribute("data-conv-resposta").split(":");
          var passo = partes[0];
          var resposta = partes[1] === "sim";
          var parcial = {};
          parcial["resposta" + passo] = resposta;
          if (passo === "1") { parcial.resposta2 = null; parcial.resposta3 = null; parcial.etapaEscolhida = null; }
          if (passo === "2") { parcial.resposta3 = null; parcial.etapaEscolhida = null; }
          if (passo === "3") { parcial.etapaEscolhida = null; }
          window.GuiaStorage.setConvalidacaoPartial(parcial);
          ConvalidacaoFlow.render();
        });
      });
      document.querySelectorAll("[data-conv-etapa]").forEach(function (botao) {
        botao.addEventListener("click", function () {
          window.GuiaStorage.setConvalidacaoPartial({ etapaEscolhida: botao.getAttribute("data-conv-etapa") });
          ConvalidacaoFlow.render();
        });
      });
      var btnReiniciar = document.getElementById("btn-reiniciar-convalidacao");
      if (btnReiniciar) {
        btnReiniciar.addEventListener("click", function () {
          window.GuiaStorage.setConvalidacaoPartial({ resposta1: null, resposta2: null, resposta3: null, etapaEscolhida: null });
          ConvalidacaoFlow.render();
        });
      }
      this.render();
    }
  };

  function wireBotoesGerais(conteudo) {
    document.querySelectorAll("[data-escolher-jornada]").forEach(function (botao) {
      botao.addEventListener("click", function () {
        var jornada = botao.getAttribute("data-escolher-jornada");
        window.GuiaStorage.setPartial({ jornada: jornada });
        marcarJornadaEscolhida(jornada);
        var alvo = document.getElementById("requisitos");
        if (alvo) alvo.scrollIntoView({ behavior: "smooth" });
      });
    });

    var btnComecar = document.getElementById("btn-comecar-jornada");
    if (btnComecar) {
      btnComecar.addEventListener("click", function () {
        var alvo = document.getElementById("requisitos");
        if (alvo) alvo.scrollIntoView({ behavior: "smooth" });
      });
    }

    var btnContinuar = document.getElementById("btn-continuar");
    if (btnContinuar) {
      btnContinuar.addEventListener("click", function () {
        var idAlvo = window.Progresso.primeiraEtapaPendente();
        var alvo = document.getElementById(idAlvo);
        if (alvo) alvo.scrollIntoView({ behavior: "smooth" });
      });
    }

    document.querySelectorAll("[data-escolher-local-pretendido]").forEach(function (botao) {
      botao.addEventListener("click", function () {
        var valor = botao.getAttribute("data-escolher-local-pretendido");
        window.GuiaStorage.setPartial({ localPretendido: valor });
        atualizarPressedGrupo("[data-escolher-local-pretendido]", "data-escolher-local-pretendido", valor);
      });
    });

    document.querySelectorAll("[data-escolher-local]").forEach(function (botao) {
      botao.addEventListener("click", function () {
        var valor = botao.getAttribute("data-escolher-local");
        window.GuiaStorage.setPartial({ localEstagio: valor });
        aplicarLocalEstagio(valor);
      });
    });

    var btnReiniciarChecklist = document.getElementById("btn-reiniciar-checklist");
    if (btnReiniciarChecklist) {
      btnReiniciarChecklist.addEventListener("click", function () {
        var textoAviso = (conteudo && conteudo.avisos && conteudo.avisos.reiniciar) || AVISO_REINICIAR_PADRAO;
        abrirModalConfirmacao(textoAviso, function () {
          window.GuiaStorage.resetTudo();
          document.querySelectorAll(".regularizacao-bloco[data-local]").forEach(function (b) { b.classList.add("is-hidden"); });
          var vazio = document.querySelector("[data-regularizacao-vazio]");
          if (vazio) vazio.classList.remove("is-hidden");
          document.querySelectorAll("[data-escolher-local], [data-escolher-local-pretendido]").forEach(function (b) {
            b.removeAttribute("aria-pressed");
          });
          marcarJornadaEscolhida(null);
          var detalheArea = document.getElementById("area-detalhe");
          if (detalheArea) detalheArea.classList.add("is-hidden");
          document.querySelectorAll(".card-area").forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
          ConvalidacaoFlow.render();
          window.Progresso.recalcular();
        });
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    mostrarAvisoStorageSeNecessario();

    Promise.all([
      fetch("data/documentos.json").then(function (r) { return r.json(); }),
      fetch("data/faq.json").then(function (r) { return r.json(); }),
      fetch("data/conteudo.json").then(function (r) { return r.json(); })
    ])
      .then(function (resultados) {
        var documentos = resultados[0];
        var faq = resultados[1];
        var conteudo = resultados[2];

        window.GuiaDocumentos = documentos;
        window.GuiaFaq = faq;
        window.GuiaConteudo = conteudo;

        renderFundamentos(conteudo);
        renderPapeis(conteudo);
        renderAreas(conteudo);
        renderFaq(faq, conteudo);
        renderLegislacao(conteudo.legislacao);
        renderContatoRodape(conteudo);

        window.Documentos.initReferenciasSimples(documentos);
        window.Documentos.initPainel(documentos);

        window.Checklist.init();
        window.Progresso.init();
        window.Navegacao.init();
        window.Navegacao.ligarAcordeoes(document);
        window.Busca.init();

        restaurarEstadoVisual();
        ConvalidacaoFlow.init();
        wireBotoesGerais(conteudo);

        // A rolagem nativa do navegador para o âncora da URL foi suprimida
        // (ver script no <head>) porque aconteceria antes do conteúdo
        // dinâmico ser renderizado. Aplicamos a rolagem correta agora, com
        // tudo já renderizado, e devolvemos o hash à URL para compartilhamento.
        if (window.__guiaHashInicial) {
          var alvoHash = document.querySelector(window.__guiaHashInicial);
          if (alvoHash) alvoHash.scrollIntoView({ behavior: "auto", block: "start" });
          if (window.history && window.history.replaceState) {
            window.history.replaceState(
              null,
              "",
              window.location.pathname + window.location.search + window.__guiaHashInicial
            );
          }
        }
      })
      .catch(function (erro) {
        console.error("Falha ao carregar os dados do Guia:", erro);
      });
  });
})();
