/*
  Guia do Estágio Supervisionado — UNEMAT
  documentos.js — renderização dos cartões de documentos (data/documentos.json)
  e do painel "Meus documentos" com filtros por etapa de uso.
*/

(function () {
  "use strict";

  function escaparHtml(texto) {
    var div = document.createElement("div");
    div.textContent = texto == null ? "" : String(texto);
    return div.innerHTML;
  }

  function cartaoHtml(doc) {
    var partes = [];
    partes.push('<article class="card' + (doc.disponivel ? "" : " card-indisponivel") + '" data-documento-card="' + doc.id + '">');
    partes.push('<span class="card-badge">' + escaparHtml(doc.anexo) + "</span>");
    partes.push("<h4>" + escaparHtml(doc.titulo) + "</h4>");
    partes.push("<p>" + escaparHtml(doc.descricao) + "</p>");
    if (doc.quandoUsar) {
      partes.push('<p class="texto-secundario"><strong>Quando usar:</strong> ' + escaparHtml(doc.quandoUsar) + "</p>");
    }
    if (doc.disponivel) {
      partes.push('<a class="botao botao-outline" href="' + escaparHtml(doc.arquivo) + '" download>Baixar</a>');
    } else {
      partes.push('<p class="card-indisponivel-aviso">Arquivo ainda não disponibilizado.</p>');
      if (doc.observacao) {
        partes.push('<p class="texto-secundario">' + escaparHtml(doc.observacao) + "</p>");
      }
    }
    partes.push(
      '<label class="providenciei"><input type="checkbox" data-check-id="doc-' +
        escaparHtml(doc.id) +
        '"> Já providenciei</label>'
    );
    partes.push("</article>");
    return partes.join("");
  }

  function porId(lista, id) {
    return lista.filter(function (d) { return d.id === id; })[0];
  }

  function porEtapa(lista, etapa) {
    return lista.filter(function (d) { return d.etapa === etapa; });
  }

  function porCategoria(lista, categoria) {
    if (categoria === "todos") return lista;
    return lista.filter(function (d) { return d.categoria === categoria; });
  }

  var CATEGORIAS_ROTULOS = {
    "antes-de-comecar": "Antes de começar",
    "regularizacao": "Regularização",
    "planejamento": "Planejamento",
    "durante": "Durante",
    "finalizacao": "Finalização",
    "convalidacao": "Convalidação"
  };

  function renderPainel(lista, categoriaAtiva) {
    var container = document.getElementById("painel-documentos");
    if (!container) return;
    var filtrados = porCategoria(lista, categoriaAtiva);
    var agrupado = {};
    filtrados.forEach(function (doc) {
      var chave = doc.categoria || "outros";
      if (!agrupado[chave]) agrupado[chave] = [];
      agrupado[chave].push(doc);
    });
    var html = "";
    Object.keys(agrupado).forEach(function (chave) {
      html += '<div class="documentos-grupo">';
      html += "<h3>" + escaparHtml(CATEGORIAS_ROTULOS[chave] || chave) + "</h3>";
      html += '<div class="cards-grid">' + agrupado[chave].map(cartaoHtml).join("") + "</div>";
      html += "</div>";
    });
    container.innerHTML = html || '<p class="texto-secundario">Nenhum documento encontrado para este filtro.</p>';
    window.Checklist.scan(container);
  }

  window.Documentos = {
    initReferenciasSimples: function (lista) {
      document.querySelectorAll('[data-render="documentos"]').forEach(function (container) {
        var idAlvo = container.getAttribute("data-documento-id");
        var etapaAlvo = container.getAttribute("data-etapa-documentos");
        var docs = [];
        if (idAlvo) {
          var doc = porId(lista, idAlvo);
          if (doc) docs = [doc];
        } else if (etapaAlvo) {
          docs = porEtapa(lista, etapaAlvo);
        }
        container.innerHTML = docs.map(cartaoHtml).join("");
        window.Checklist.scan(container);
      });
    },
    initPainel: function (lista) {
      var container = document.getElementById("filtros-documentos");
      renderPainel(lista, "todos");
      if (!container) return;
      container.addEventListener("click", function (evento) {
        var botao = evento.target.closest("[data-filtro-categoria]");
        if (!botao) return;
        container.querySelectorAll(".filtro-chip").forEach(function (chip) {
          chip.classList.remove("is-ativo");
        });
        botao.classList.add("is-ativo");
        renderPainel(lista, botao.getAttribute("data-filtro-categoria"));
      });
    }
  };
})();
