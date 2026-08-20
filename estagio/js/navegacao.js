/*
  Guia do Estágio Supervisionado — UNEMAT
  navegacao.js — menu mobile, acordeões, rolagem suave entre etapas e
  IntersectionObserver para destacar a seção/etapa atual.
*/

(function () {
  "use strict";

  function initMenu() {
    var toggle = document.getElementById("menu-toggle");
    var nav = document.getElementById("nav-principal");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var aberto = nav.classList.toggle("is-aberto");
      toggle.setAttribute("aria-expanded", String(aberto));
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-aberto");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function initProximaEtapaBotoes() {
    document.querySelectorAll("[data-proxima-etapa]").forEach(function (botao) {
      botao.addEventListener("click", function () {
        var destino = document.getElementById(botao.getAttribute("data-proxima-etapa"));
        if (destino) destino.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  function ligarAcordeao(botao) {
    if (botao.getAttribute("data-guia-acordeao-ligado") === "1") return;
    botao.setAttribute("data-guia-acordeao-ligado", "1");
    botao.addEventListener("click", function () {
      var alvo = document.getElementById(botao.getAttribute("aria-controls"));
      var estaAberto = botao.getAttribute("aria-expanded") === "true";
      botao.setAttribute("aria-expanded", String(!estaAberto));
      if (alvo) alvo.hidden = estaAberto;
    });
  }

  function initObservadorEtapas() {
    var secoesEtapa = Array.prototype.slice.call(document.querySelectorAll(".etapa[data-etapa]"));
    if (!secoesEtapa.length || !("IntersectionObserver" in window)) return;
    var observer = new IntersectionObserver(
      function (entradas) {
        var visivel = entradas
          .filter(function (e) { return e.isIntersecting; })
          .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; })[0];
        if (visivel) {
          var etapaId = visivel.target.getAttribute("data-etapa");
          document.dispatchEvent(new CustomEvent("guia:secao-atual-mudou", { detail: { etapaId: etapaId } }));
        }
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    secoesEtapa.forEach(function (secao) { observer.observe(secao); });
  }

  function initObservadorNavPrincipal() {
    var secoes = Array.prototype.slice.call(document.querySelectorAll("main > section[id]"));
    var links = {};
    document.querySelectorAll('.nav-principal a[href^="#"]').forEach(function (link) {
      links[link.getAttribute("href").slice(1)] = link;
    });
    if (!secoes.length || !("IntersectionObserver" in window)) return;
    var observer = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (entrada) {
          if (!entrada.isIntersecting) return;
          var id = entrada.target.id;
          Object.keys(links).forEach(function (chave) {
            links[chave].removeAttribute("aria-current");
          });
          if (links[id]) links[id].setAttribute("aria-current", "true");
          window.GuiaStorage.setPartial({ ultimaSecao: id });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    secoes.forEach(function (secao) { observer.observe(secao); });
  }

  window.Navegacao = {
    init: function () {
      initMenu();
      initProximaEtapaBotoes();
      this.ligarAcordeoes(document);
      initObservadorEtapas();
      initObservadorNavPrincipal();
    },
    ligarAcordeoes: function (raiz) {
      (raiz || document).querySelectorAll(".acordeao-toggle, .faq-pergunta").forEach(ligarAcordeao);
    }
  };
})();
