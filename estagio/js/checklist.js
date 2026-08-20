/*
  Guia do Estágio Supervisionado — UNEMAT
  checklist.js — armazenamento local (localStorage) e marcação de checkboxes.

  Único armazenamento local usado pelo Guia. NUNCA grava nome, matrícula, CPF,
  e-mail, telefone, empresa, nota ou qualquer dado pessoal — apenas jornada
  escolhida, checkboxes marcados, local do estágio e a última seção visitada.
*/

(function () {
  "use strict";

  var STORAGE_KEY = "guiaEstagio.v1";

  function defaultState() {
    return {
      jornada: null,
      localPretendido: null,
      localEstagio: null,
      checklist: {},
      ultimaSecao: null,
      convalidacao: { resposta1: null, resposta2: null, resposta3: null, etapaEscolhida: null },
      prefs: {}
    };
  }

  function isStorageAvailable() {
    try {
      var chave = "__guia_estagio_teste__";
      window.localStorage.setItem(chave, "1");
      window.localStorage.removeItem(chave);
      return true;
    } catch (e) {
      return false;
    }
  }

  var storageOk = isStorageAvailable();

  function carregar() {
    if (!storageOk) return defaultState();
    try {
      var bruto = window.localStorage.getItem(STORAGE_KEY);
      if (!bruto) return defaultState();
      var salvo = JSON.parse(bruto);
      var base = defaultState();
      return Object.assign(base, salvo, {
        checklist: Object.assign({}, salvo.checklist || {}),
        convalidacao: Object.assign({}, base.convalidacao, salvo.convalidacao || {})
      });
    } catch (e) {
      return defaultState();
    }
  }

  var estado = carregar();

  function persistir() {
    if (!storageOk) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    } catch (e) {
      // Guia continua funcionando apenas com o estado em memória desta sessão.
    }
  }

  function notificar() {
    document.dispatchEvent(new CustomEvent("guia:estado-mudou"));
  }

  window.GuiaStorage = {
    isAvailable: function () {
      return storageOk;
    },
    getState: function () {
      return estado;
    },
    setPartial: function (parcial) {
      estado = Object.assign({}, estado, parcial);
      persistir();
      notificar();
    },
    setChecklistValue: function (id, valor) {
      var checklist = Object.assign({}, estado.checklist);
      checklist[id] = valor;
      estado = Object.assign({}, estado, { checklist: checklist });
      persistir();
      notificar();
    },
    setConvalidacaoPartial: function (parcial) {
      estado = Object.assign({}, estado, { convalidacao: Object.assign({}, estado.convalidacao, parcial) });
      persistir();
      notificar();
    },
    resetTudo: function () {
      estado = defaultState();
      persistir();
      notificar();
    }
  };

  var elementosLigados = typeof WeakSet !== "undefined" ? new WeakSet() : null;

  function jaLigado(elemento) {
    if (!elementosLigados) return elemento.getAttribute("data-guia-ligado") === "1";
    return elementosLigados.has(elemento);
  }

  function marcarLigado(elemento) {
    if (elementosLigados) {
      elementosLigados.add(elemento);
    } else {
      elemento.setAttribute("data-guia-ligado", "1");
    }
  }

  function ligarCheckbox(input) {
    if (jaLigado(input)) return;
    marcarLigado(input);
    var id = input.getAttribute("data-check-id");
    input.checked = !!window.GuiaStorage.getState().checklist[id];
    input.addEventListener("change", function () {
      window.GuiaStorage.setChecklistValue(id, input.checked);
    });
  }

  function sincronizar(raiz) {
    var estadoAtual = window.GuiaStorage.getState();
    (raiz || document).querySelectorAll("input[type=checkbox][data-check-id]").forEach(function (input) {
      var id = input.getAttribute("data-check-id");
      var valor = !!estadoAtual.checklist[id];
      if (input.checked !== valor) input.checked = valor;
    });
  }

  window.Checklist = {
    init: function () {
      this.scan(document);
      document.addEventListener("guia:estado-mudou", function () {
        sincronizar(document);
      });
    },
    scan: function (raiz) {
      (raiz || document).querySelectorAll("input[type=checkbox][data-check-id]").forEach(ligarCheckbox);
    }
  };
})();
