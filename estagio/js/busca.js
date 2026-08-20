/*
  Guia do Estágio Supervisionado — UNEMAT
  busca.js — busca local simples (sem servidor), indexando títulos, checklists,
  documentos e perguntas do FAQ já renderizados na página.
*/

(function () {
  "use strict";

  var indice = [];

  function normalizar(texto) {
    var semAcentos = (texto || "").normalize("NFD");
    var resultado = "";
    for (var i = 0; i < semAcentos.length; i++) {
      var codigo = semAcentos.charCodeAt(i);
      var ehMarcaDiacritica = codigo >= 768 && codigo <= 879; // faixa Unicode 0x0300–0x036F
      if (!ehMarcaDiacritica) resultado += semAcentos[i];
    }
    return resultado.toLowerCase();
  }

  function construirIndice() {
    indice = [];
    document.querySelectorAll("main section[id]").forEach(function (secao) {
      var titulo = secao.querySelector("h2");
      if (titulo) {
        indice.push({ texto: titulo.textContent.trim(), url: "#" + secao.id, contexto: "Seção" });
      }
      secao.querySelectorAll("h3, h4").forEach(function (h) {
        indice.push({ texto: h.textContent.trim(), url: "#" + secao.id, contexto: titulo ? titulo.textContent.trim() : "" });
      });
      secao.querySelectorAll(".checklist label").forEach(function (label) {
        indice.push({ texto: label.textContent.trim(), url: "#" + secao.id, contexto: "Checklist" });
      });
      secao.querySelectorAll(".faq-pergunta").forEach(function (botao) {
        indice.push({ texto: botao.textContent.trim(), url: "#faq", contexto: "FAQ" });
      });
    });
  }

  function destacar(texto, termo) {
    var idx = normalizar(texto).indexOf(termo);
    if (idx === -1) return texto;
    return texto.slice(0, idx) + "<mark>" + texto.slice(idx, idx + termo.length) + "</mark>" + texto.slice(idx + termo.length);
  }

  function buscar(termoBruto, container) {
    var termo = normalizar(termoBruto).trim();
    if (!termo) {
      container.innerHTML = "";
      container.hidden = true;
      return;
    }
    var resultados = indice
      .filter(function (item) { return normalizar(item.texto).indexOf(termo) !== -1; })
      .slice(0, 15);

    if (!resultados.length) {
      container.innerHTML = '<p class="texto-secundario">Nenhum resultado para "' + termoBruto + '".</p>';
      container.hidden = false;
      return;
    }

    container.innerHTML =
      "<ul>" +
      resultados
        .map(function (item) {
          return (
            '<li><a href="' +
            item.url +
            '">' +
            destacar(item.texto, termo) +
            '<br><span class="texto-secundario">' +
            item.contexto +
            "</span></a></li>"
          );
        })
        .join("") +
      "</ul>";
    container.hidden = false;
  }

  window.Busca = {
    init: function () {
      construirIndice();
      var form = document.getElementById("busca-form");
      var input = document.getElementById("busca-input");
      if (!form || !input) return;

      var container = document.createElement("div");
      container.id = "busca-resultados";
      container.hidden = true;
      form.insertAdjacentElement("afterend", container);

      form.addEventListener("submit", function (evento) {
        evento.preventDefault();
        buscar(input.value, container);
      });
      input.addEventListener("input", function () {
        buscar(input.value, container);
      });
      document.addEventListener("click", function (evento) {
        if (!container.contains(evento.target) && evento.target !== input) {
          container.hidden = true;
        }
      });
    },
    reconstruirIndice: construirIndice
  };
})();
