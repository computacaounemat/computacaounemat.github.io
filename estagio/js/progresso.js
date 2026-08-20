/*
  Guia do Estágio Supervisionado — UNEMAT
  progresso.js — barra da jornada (8 etapas) e painel "Seu progresso".
*/

(function () {
  "use strict";

  var ETAPAS_ORDEM = [
    "requisitos", "local", "regularizacao", "planejamento",
    "execucao", "registros", "relatorio", "conclusao"
  ];

  var ICONES = { concluida: "✓", andamento: "●", pendente: "○" };

  var etapaAtual = null;

  function inputsDaEtapa(etapaId) {
    if (etapaId === "regularizacao") {
      var blocoAtivo = document.querySelector(".regularizacao-bloco[data-local]:not(.is-hidden)");
      if (!blocoAtivo) return [];
      return Array.prototype.slice.call(blocoAtivo.querySelectorAll("input[type=checkbox][data-check-id]"));
    }
    var secao = document.querySelector('.etapa[data-etapa="' + etapaId + '"]');
    if (!secao) return [];
    return Array.prototype.slice.call(
      secao.querySelectorAll('.checklist:not([data-checklist-optional]) input[type=checkbox][data-check-id]')
    );
  }

  function statusDaEtapa(etapaId) {
    if (etapaId === "conclusao") {
      var todasConcluidas = ETAPAS_ORDEM.slice(0, -1).every(function (id) {
        return statusDaEtapa(id) === "concluida";
      });
      if (todasConcluidas) return "concluida";
      return etapaId === etapaAtual ? "andamento" : "pendente";
    }
    var inputs = inputsDaEtapa(etapaId);
    if (inputs.length === 0) {
      return etapaId === etapaAtual ? "andamento" : "pendente";
    }
    var marcados = inputs.filter(function (i) { return i.checked; }).length;
    if (marcados === inputs.length) return "concluida";
    if (marcados > 0 || etapaId === etapaAtual) return "andamento";
    return "pendente";
  }

  function totalGeral() {
    var total = 0;
    var feitos = 0;
    ETAPAS_ORDEM.slice(0, -1).forEach(function (etapaId) {
      var inputs = inputsDaEtapa(etapaId);
      total += inputs.length;
      feitos += inputs.filter(function (i) { return i.checked; }).length;
    });
    return { total: total, feitos: feitos };
  }

  function renderBarraJornada() {
    ETAPAS_ORDEM.forEach(function (etapaId) {
      var li = document.querySelector('#lista-jornada [data-etapa-item="' + etapaId + '"]');
      if (!li) return;
      var status = statusDaEtapa(etapaId);
      li.setAttribute("data-status", status);
      var icone = li.querySelector(".etapa-icone");
      if (icone) icone.textContent = ICONES[status];
      var link = li.querySelector("a");
      if (link) {
        if (etapaId === etapaAtual) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      }
    });
  }

  function mostrarConclusaoJornada() {
    var bloco = document.getElementById("bloco-conclusao-jornada");
    if (!bloco || !window.GuiaConteudo) return;
    var avisos = window.GuiaConteudo.avisos || {};
    var titulo = document.getElementById("conclusao-jornada-titulo");
    var aviso = document.getElementById("conclusao-jornada-aviso");
    if (titulo) titulo.textContent = "✓ " + (avisos.conclusaoJornada || "");
    if (aviso) aviso.textContent = avisos.conclusaoAviso || "";
    bloco.classList.remove("is-hidden");
  }

  function esconderConclusaoJornada() {
    var bloco = document.getElementById("bloco-conclusao-jornada");
    if (bloco) bloco.classList.add("is-hidden");
  }

  function renderPainel() {
    var r = totalGeral();
    var pct = r.total === 0 ? 0 : Math.round((r.feitos / r.total) * 100);

    var texto = document.getElementById("progresso-texto");
    if (texto) texto.textContent = r.feitos + " de " + r.total + " tarefas concluídas — " + pct + "%";

    var barraVisual = document.getElementById("barra-progresso-visual");
    if (barraVisual) barraVisual.setAttribute("aria-valuenow", String(pct));

    var preenchida = document.getElementById("barra-progresso-preenchida");
    if (preenchida) preenchida.style.width = pct + "%";

    var estadoAtual = window.GuiaStorage.getState();
    var temProgresso = r.feitos > 0 || !!estadoAtual.jornada;
    var banner = document.getElementById("banner-continuar");
    if (banner) banner.classList.toggle("is-hidden", !temProgresso);

    if (r.total > 0 && r.feitos === r.total) {
      mostrarConclusaoJornada();
    } else {
      esconderConclusaoJornada();
    }
  }

  function render() {
    renderBarraJornada();
    renderPainel();
  }

  window.Progresso = {
    init: function () {
      var barra = document.getElementById("barra-jornada");
      if (barra) barra.hidden = false;
      var painel = document.getElementById("painel-progresso");
      if (painel) painel.hidden = false;

      document.addEventListener("guia:estado-mudou", render);
      document.addEventListener("guia:secao-atual-mudou", function (evento) {
        etapaAtual = evento.detail && evento.detail.etapaId;
        render();
      });
      render();
    },
    primeiraEtapaPendente: function () {
      for (var i = 0; i < ETAPAS_ORDEM.length - 1; i++) {
        if (statusDaEtapa(ETAPAS_ORDEM[i]) !== "concluida") return ETAPAS_ORDEM[i];
      }
      return "conclusao";
    },
    recalcular: render
  };
})();
