const HOTEL = "Terabithia";
const SENHA_SISTEMA = "2678";
const LIMITE_TENTATIVAS = 3;
const TOTAL_QUARTOS = 20;
const TANQUE_LITROS = 42;

const estado = {
  tentativas: 0,
  usuarioAtual: "",
  quartos: Array(TOTAL_QUARTOS).fill(false),
  hospedes: [],
  reservas: [],
  eventos: [],
  orcamentosAr: [],
  receitaHospedagem: 0,
  receitaEventos: 0
};

function pegar(id) {
  return document.getElementById(id);
}

function valorTexto(id) {
  return pegar(id).value.trim();
}

function valorNumero(id) {
  return Number(pegar(id).value);
}

function dinheiro(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function normalizarTexto(texto) {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function mostrarErro(local, mensagem) {
  pegar(local).innerHTML = `<p class="status-erro">${mensagem}</p>`;
}

function mostrarSucesso(local, mensagem) {
  pegar(local).innerHTML = `<p class="status-ok">${mensagem}</p>`;
}

function limparCampos(ids) {
  ids.forEach(id => pegar(id).value = "");
}

function login() {
  const usuario = valorTexto("usuario");
  const senha = valorTexto("senha");
  const aviso = pegar("avisoLogin");

  if (usuario === "") {
    aviso.innerHTML = `<span class="status-erro">Digite seu usuário.</span>`;
    return;
  }

  if (senha === SENHA_SISTEMA) {
    estado.usuarioAtual = usuario;

    pegar("loginScreen").classList.add("escondido");
    pegar("dashboard").classList.remove("escondido");

    pegar("nomeUsuario").textContent = usuario;
    pegar("avatar").textContent = usuario.charAt(0).toUpperCase();

    pegar("mensagemBoasVindas").textContent =
      `Bem-vindo ao Hotel ${HOTEL}, ${usuario}. É um imenso prazer ter você por aqui!`;

    atualizarMapaQuartos();
    return;
  }

  estado.tentativas++;
  const restantes = LIMITE_TENTATIVAS - estado.tentativas;

  if (estado.tentativas >= LIMITE_TENTATIVAS) {
    aviso.innerHTML = `<span class="status-erro">Sistema bloqueado. Limite de tentativas excedido.</span>`;

    pegar("usuario").disabled = true;
    pegar("senha").disabled = true;

    document.querySelector(".caixa-login button").disabled = true;
    return;
  }

  aviso.innerHTML = `<span class="status-alerta">Senha incorreta. Restam ${restantes} tentativa(s).</span>`;
}

function abrirModulo(id) {
  document.querySelectorAll(".modulo").forEach(modulo => {
    modulo.classList.add("escondido");
  });

  pegar(id).classList.remove("escondido");

  if (id === "relatorios") gerarRelatorio();
  if (id === "reservas") atualizarMapaQuartos();
  if (id === "hospedes") listarHospedes();
  if (id === "ar") atualizarListaOrcamentosAr();

  pegar(id).scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function voltarMenu() {
  document.querySelectorAll(".modulo").forEach(modulo => {
    modulo.classList.add("escondido");
  });

  pegar("menuPrincipal").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function sairSistema() {
  alert(`Muito obrigado e até logo, ${estado.usuarioAtual}.`);
  location.reload();
}

function dadosTipoQuarto(codigo) {
  const tipos = {
    S: { nome: "Standard", fator: 1 },
    E: { nome: "Executivo", fator: 1.35 },
    L: { nome: "Luxo", fator: 1.65 }
  };

  return tipos[codigo] || tipos.S;
}

function quartosLivres() {
  return estado.quartos
    .map((ocupado, index) => ocupado ? null : index + 1)
    .filter(Boolean);
}

function reservar() {
  const diaria = valorNumero("diaria");
  const dias = valorNumero("dias");
  const nome = valorTexto("nomeHospedeReserva");
  const tipo = dadosTipoQuarto(valorTexto("tipoQuarto"));
  const quarto = valorNumero("quarto");
  const confirmacao = valorTexto("confirmarReserva");
  const resultado = "resultadoReserva";

  if (diaria <= 0 || dias < 1 || dias > 30) {
    mostrarErro(resultado, `Valor inválido, ${estado.usuarioAtual}. A diária deve ser maior que zero e as diárias devem ficar entre 1 e 30.`);
    return;
  }

  if (nome === "") {
    mostrarErro(resultado, "Informe o nome completo do hóspede.");
    return;
  }

  if (!Number.isInteger(quarto) || quarto < 1 || quarto > TOTAL_QUARTOS) {
    mostrarErro(resultado, "Quarto inválido. Escolha um número de 1 a 20.");
    return;
  }

  if (estado.quartos[quarto - 1]) {
    mostrarErro(resultado, `Quarto já está ocupado. Quartos livres: ${quartosLivres().join(", ") || "nenhum"}.`);
    atualizarMapaQuartos();
    return;
  }

  const subtotal = diaria * dias * tipo.fator;
  const taxa = subtotal * 0.10;
  const total = subtotal + taxa;

  if (confirmacao !== "S") {
    pegar(resultado).innerHTML = `
      <h3>Resumo da reserva</h3>
      <p><strong>Hóspede:</strong> ${nome}</p>
      <p><strong>Quarto:</strong> ${quarto} (${tipo.nome})</p>
      <p><strong>Subtotal:</strong> ${dinheiro(subtotal)}</p>
      <p><strong>Taxa de serviço (10%):</strong> ${dinheiro(taxa)}</p>
      <p><strong>Total:</strong> ${dinheiro(total)}</p>
      <p class="status-alerta">Reserva não efetuada.</p>
    `;
    return;
  }

  estado.quartos[quarto - 1] = true;
  estado.receitaHospedagem += total;

  estado.reservas.push({
    hospede: nome,
    quarto,
    tipo: tipo.nome,
    diarias: dias,
    subtotal,
    taxa,
    total,
    data: new Date()
  });

  pegar(resultado).innerHTML = `
    <h3>Reserva efetuada com sucesso</h3>
    <p><strong>Hóspede:</strong> ${nome}</p>
    <p><strong>Quarto:</strong> ${quarto} (${tipo.nome})</p>
    <p><strong>Diárias:</strong> ${dias}</p>
    <p><strong>Subtotal:</strong> ${dinheiro(subtotal)}</p>
    <p><strong>Taxa de serviço (10%):</strong> ${dinheiro(taxa)}</p>
    <p><strong>Total final:</strong> ${dinheiro(total)}</p>
  `;

  limparCampos(["diaria", "dias", "nomeHospedeReserva", "quarto"]);
  atualizarMapaQuartos();
}

function atualizarMapaQuartos() {
  const mapa = pegar("mapaQuartos");

  if (!mapa) return;

  let html = `
    <h3>Mapa de quartos</h3>
    <p><strong>L</strong> = livre | <strong>O</strong> = ocupado</p>
    <div class="grade-quartos">
  `;

  estado.quartos.forEach((ocupado, index) => {
    html += `
      <div class="caixa-quarto ${ocupado ? "ocupado" : "livre"}">
        ${index + 1}<br>${ocupado ? "O" : "L"}
      </div>
    `;
  });

  html += "</div>";

  mapa.innerHTML = html;
}

function mostrarAreaHospede(id) {
  document.querySelectorAll(".painel-hospede").forEach(area => {
    area.classList.add("escondido");
  });

  pegar(id).classList.remove("escondido");
}

function hospedesOrdenados() {
  return [...estado.hospedes].sort((a, b) => {
    return a.nome.localeCompare(b.nome, "pt-BR");
  });
}

function cadastrarHospede() {
  const nome = valorTexto("novoHospede");

  if (nome === "") {
    mostrarErro("listaHospedes", "Digite o nome do hóspede.");
    return;
  }

  if (estado.hospedes.length >= 15) {
    mostrarErro("listaHospedes", "Máximo de cadastros atingido.");
    return;
  }

  const existe = estado.hospedes.some(hospede => {
    return normalizarTexto(hospede.nome) === normalizarTexto(nome);
  });

  if (existe) {
    mostrarErro("listaHospedes", "Hóspede já cadastrado.");
    return;
  }

  estado.hospedes.push({
    nome,
    cadastro: new Date()
  });

  pegar("novoHospede").value = "";

  mostrarSucesso("listaHospedes", "Hóspede cadastrado com sucesso. Operação realizada com sucesso.");
}

function listarHospedes() {
  const lista = hospedesOrdenados();

  if (lista.length === 0) {
    pegar("listaHospedes").innerHTML = `<p class="status-alerta">Nenhum hóspede cadastrado.</p>`;
    return;
  }

  let html = `
    <h3>Lista de hóspedes em ordem A-Z</h3>

    <table class="tabela">
      <thead>
        <tr>
          <th>Índice</th>
          <th>Nome</th>
          <th>Data/Hora de cadastro</th>
        </tr>
      </thead>

      <tbody>
  `;

  lista.forEach((hospede, index) => {
    html += `
      <tr>
        <td>${index + 1}</td>
        <td>${hospede.nome}</td>
        <td>${hospede.cadastro.toLocaleString("pt-BR")}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  pegar("listaHospedes").innerHTML = html;
}

function pesquisarHospedeExato() {
  const nome = valorTexto("pesquisaExata");

  const encontrado = estado.hospedes.find(hospede => {
    return normalizarTexto(hospede.nome) === normalizarTexto(nome);
  });

  if (!encontrado) {
    mostrarErro("listaHospedes", "Hóspede não encontrado.");
    return;
  }

  pegar("listaHospedes").innerHTML =
    `<p class="status-ok">Hóspede ${encontrado.nome} foi encontrado.</p>`;
}

function pesquisarHospedePrefixo() {
  const prefixo = normalizarTexto(valorTexto("pesquisaPrefixo"));

  if (prefixo === "") {
    mostrarErro("listaHospedes", "Digite um prefixo para pesquisar.");
    return;
  }

  const resultados = hospedesOrdenados().filter(hospede => {
    return normalizarTexto(hospede.nome).startsWith(prefixo);
  });

  if (resultados.length === 0) {
    mostrarErro("listaHospedes", "Hóspede não encontrado.");
    return;
  }

  let html = `<h3>Resultados por prefixo</h3><ol>`;

  resultados.forEach(hospede => {
    html += `<li>${hospede.nome}</li>`;
  });

  html += "</ol>";

  pegar("listaHospedes").innerHTML = html;
}

function obterHospedePorIndiceOrdenado(indice) {
  const lista = hospedesOrdenados();
  return lista[indice - 1];
}

function atualizarHospede() {
  const indice = valorNumero("indiceAtualizar");
  const novoNome = valorTexto("nomeAtualizado");
  const hospede = obterHospedePorIndiceOrdenado(indice);

  if (!hospede) {
    mostrarErro("listaHospedes", "Índice inválido. Liste os hóspedes para conferir o índice correto.");
    return;
  }

  if (novoNome === "") {
    mostrarErro("listaHospedes", "Digite o novo nome do hóspede.");
    return;
  }

  const duplicado = estado.hospedes.some(item => {
    return item !== hospede && normalizarTexto(item.nome) === normalizarTexto(novoNome);
  });

  if (duplicado) {
    mostrarErro("listaHospedes", "Hóspede já cadastrado.");
    return;
  }

  hospede.nome = novoNome;

  limparCampos(["indiceAtualizar", "nomeAtualizado"]);

  mostrarSucesso("listaHospedes", "Operação realizada com sucesso. Cadastro atualizado.");
}

function removerHospede() {
  const indice = valorNumero("indiceRemover");
  const hospede = obterHospedePorIndiceOrdenado(indice);

  if (!hospede) {
    mostrarErro("listaHospedes", "Índice inválido. Liste os hóspedes para conferir o índice correto.");
    return;
  }

  estado.hospedes = estado.hospedes.filter(item => item !== hospede);

  pegar("indiceRemover").value = "";

  mostrarSucesso("listaHospedes", "Operação realizada com sucesso. Cadastro removido.");
}

function selecionarAuditorio(convidados) {
  if (convidados <= 220) {
    return {
      nome: "Laranja",
      cadeirasExtras: Math.max(0, convidados - 150)
    };
  }

  return {
    nome: "Colorado",
    cadeirasExtras: 0
  };
}

function janelaEvento(dia) {
  const d = normalizarTexto(dia);

  const semana = ["segunda", "terca", "quarta", "quinta", "sexta"];
  const fimSemana = ["sabado", "domingo"];

  if (semana.includes(d)) {
    return { inicio: 7, fim: 23, valido: true };
  }

  if (fimSemana.includes(d)) {
    return { inicio: 7, fim: 15, valido: true };
  }

  return { valido: false };
}

function calcularEvento() {
  const convidados = valorNumero("convidados");
  const dia = valorTexto("diaEvento");
  const hora = valorNumero("horaEvento");
  const duracao = valorNumero("duracaoEvento");
  const empresa = valorTexto("empresaEvento");
  const confirmacao = valorTexto("confirmarEvento");
  const resultado = "resultadoEvento";

  if (!Number.isInteger(convidados) || convidados <= 0 || convidados > 350) {
    mostrarErro(resultado, "Número de convidados inválido. O limite é de 1 a 350 convidados.");
    return;
  }

  if (empresa === "" || dia === "") {
    mostrarErro(resultado, "Informe o dia do evento e o nome da empresa.");
    return;
  }

  if (!Number.isInteger(hora)) {
    mostrarErro(resultado, "Hora inicial inválida. Use apenas número inteiro.");
    return;
  }

  if (!Number.isInteger(duracao) || duracao < 1 || duracao > 12) {
    mostrarErro(resultado, "Duração inválida. A duração deve ser entre 1 e 12 horas.");
    return;
  }

  const janela = janelaEvento(dia);

  if (!janela.valido) {
    mostrarErro(resultado, "Dia da semana inválido. Use segunda, terça, quarta, quinta, sexta, sábado ou domingo.");
    return;
  }

  const horaFim = hora + duracao;

  if (hora < janela.inicio || horaFim > janela.fim) {
    mostrarErro(resultado, `Auditório indisponível. Nesse dia, o horário permitido é das ${janela.inicio}h às ${janela.fim}h.`);
    return;
  }

  const auditorio = selecionarAuditorio(convidados);
  const garcons = Math.ceil(convidados / 12) + Math.floor(duracao / 2);
  const custoGarcons = garcons * duracao * 10.50;

  const cafeLitros = convidados * 0.2;
  const aguaLitros = convidados * 0.5;
  const salgados = convidados * 7;

  const custoBuffet =
    (cafeLitros * 0.80) +
    (aguaLitros * 0.40) +
    ((salgados / 100) * 34);

  const total = custoGarcons + custoBuffet;

  const status = confirmacao === "S"
    ? `<p class="status-ok">Reserva efetuada com sucesso.</p>`
    : `<p class="status-alerta">Reserva não efetuada.</p>`;

  if (confirmacao === "S") {
    estado.receitaEventos += total;

    estado.eventos.push({
      empresa,
      dia,
      hora,
      horaFim,
      duracao,
      convidados,
      auditorio: auditorio.nome,
      garcons,
      custoGarcons,
      custoBuffet,
      total,
      data: new Date()
    });
  }

  pegar(resultado).innerHTML = `
    <h3>Relatório técnico do evento</h3>
    <p><strong>Auditório selecionado:</strong> ${auditorio.nome}${auditorio.nome === "Laranja" ? ` (${auditorio.cadeirasExtras} cadeiras adicionais)` : ""}</p>
    <p><strong>Empresa:</strong> ${empresa}</p>
    <p><strong>Data:</strong> ${dia}</p>
    <p><strong>Horário:</strong> ${hora}h às ${horaFim}h</p>
    <p><strong>Convidados:</strong> ${convidados}</p>
    <p><strong>Duração:</strong> ${duracao} horas</p>
    <p><strong>Garçons necessários:</strong> ${garcons}</p>
    <p><strong>Custo com garçons:</strong> ${dinheiro(custoGarcons)}</p>
    <p><strong>Café:</strong> ${cafeLitros.toFixed(1)} L</p>
    <p><strong>Água:</strong> ${aguaLitros.toFixed(1)} L</p>
    <p><strong>Salgados:</strong> ${salgados} unidades</p>
    <p><strong>Custo buffet:</strong> ${dinheiro(custoBuffet)}</p>
    <p><strong>Total do evento:</strong> ${dinheiro(total)}</p>
    ${status}
  `;

  if (confirmacao === "S") {
    limparCampos([
      "convidados",
      "diaEvento",
      "horaEvento",
      "duracaoEvento",
      "empresaEvento"
    ]);
  }
}

function adicionarOrcamentoAr() {
  const empresa = valorTexto("empresaAr");
  const valor = valorNumero("valorAr");
  const quantidade = valorNumero("quantidadeAr");
  const desconto = valorNumero("descontoAr");
  const minimo = valorNumero("minimoAr");
  const deslocamento = valorNumero("deslocamentoAr");

  if (
    empresa === "" ||
    valor <= 0 ||
    quantidade <= 0 ||
    desconto < 0 ||
    desconto > 100 ||
    minimo < 0 ||
    deslocamento < 0
  ) {
    mostrarErro("resultadoAr", "Preencha todos os dados corretamente para adicionar o orçamento.");
    return;
  }

  const bruto = valor * quantidade;
  const valorDesconto = quantidade >= minimo ? bruto * (desconto / 100) : 0;
  const total = bruto - valorDesconto + deslocamento;

  estado.orcamentosAr.push({
    empresa,
    valor,
    quantidade,
    desconto,
    minimo,
    deslocamento,
    bruto,
    valorDesconto,
    total
  });

  limparCampos([
    "empresaAr",
    "valorAr",
    "quantidadeAr",
    "descontoAr",
    "minimoAr",
    "deslocamentoAr"
  ]);

  atualizarListaOrcamentosAr();
}

function atualizarListaOrcamentosAr() {
  const box = pegar("resultadoAr");

  if (!box) return;

  if (estado.orcamentosAr.length === 0) {
    box.innerHTML = `<p class="status-alerta">Nenhum orçamento cadastrado ainda. Informe pelo menos duas empresas para comparar.</p>`;
    return;
  }

  let html = `
    <h3>Orçamentos cadastrados</h3>

    <table class="tabela">
      <thead>
        <tr>
          <th>Empresa</th>
          <th>Bruto</th>
          <th>Desconto</th>
          <th>Deslocamento</th>
          <th>Total</th>
        </tr>
      </thead>

      <tbody>
  `;

  estado.orcamentosAr.forEach(orcamento => {
    html += `
      <tr>
        <td>${orcamento.empresa}</td>
        <td>${dinheiro(orcamento.bruto)}</td>
        <td>${dinheiro(orcamento.valorDesconto)}</td>
        <td>${dinheiro(orcamento.deslocamento)}</td>
        <td><strong>${dinheiro(orcamento.total)}</strong></td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  box.innerHTML = html;
}

function finalizarOrcamentosAr() {
  if (estado.orcamentosAr.length < 2) {
    mostrarErro("resultadoAr", "Informe pelo menos duas empresas para finalizar a comparação.");
    return;
  }

  const ordenados = [...estado.orcamentosAr].sort((a, b) => {
    return a.total - b.total;
  });

  const menor = ordenados[0];
  const maior = ordenados[ordenados.length - 1];

  const diferencaPercentual =
    ((maior.total - menor.total) / menor.total) * 100;

  atualizarListaOrcamentosAr();

  pegar("resultadoAr").innerHTML += `
    <hr>
    <h3>Comparativo final</h3>
    <p class="status-ok">O orçamento de menor valor é o de ${menor.empresa} por ${dinheiro(menor.total)}.</p>
    <p><strong>Maior orçamento:</strong> ${maior.empresa} — ${dinheiro(maior.total)}</p>
    <p><strong>Diferença percentual entre melhor e pior proposta:</strong> ${diferencaPercentual.toFixed(2)}%</p>
  `;
}

function melhorCombustivel(nomePosto, alcool, gasolina) {
  const usaAlcool = alcool <= gasolina * 0.70;
  const combustivel = usaAlcool ? "Álcool" : "Gasolina";
  const preco = usaAlcool ? alcool : gasolina;

  return {
    posto: nomePosto,
    combustivel,
    preco,
    total: preco * TANQUE_LITROS
  };
}

function calcularCombustivel() {
  const alcoolWayne = valorNumero("alcoolWayne");
  const gasolinaWayne = valorNumero("gasolinaWayne");
  const alcoolStark = valorNumero("alcoolStark");
  const gasolinaStark = valorNumero("gasolinaStark");

  if (
    alcoolWayne <= 0 ||
    gasolinaWayne <= 0 ||
    alcoolStark <= 0 ||
    gasolinaStark <= 0
  ) {
    mostrarErro("resultadoCombustivel", "Informe todos os preços corretamente. Os valores precisam ser maiores que zero.");
    return;
  }

  const resultados = [
    melhorCombustivel("Wayne Oil", alcoolWayne, gasolinaWayne),
    melhorCombustivel("Stark Petrol", alcoolStark, gasolinaStark)
  ].sort((a, b) => a.total - b.total);

  let html = `
    <h3>Ranking de abastecimento</h3>

    <table class="tabela">
      <thead>
        <tr>
          <th>Posição</th>
          <th>Posto</th>
          <th>Melhor combustível</th>
          <th>Preço usado</th>
          <th>Total para 42L</th>
        </tr>
      </thead>

      <tbody>
  `;

  resultados.forEach((resultado, index) => {
    html += `
      <tr>
        <td>${index + 1}º</td>
        <td>${resultado.posto}</td>
        <td>${resultado.combustivel}</td>
        <td>${dinheiro(resultado.preco)}</td>
        <td><strong>${dinheiro(resultado.total)}</strong></td>
      </tr>
    `;
  });

  const melhor = resultados[0];

  html += `
      </tbody>
    </table>

    <p class="status-ok">
      ${estado.usuarioAtual}, é mais barato abastecer com ${melhor.combustivel.toLowerCase()} no posto ${melhor.posto}.
    </p>
  `;

  pegar("resultadoCombustivel").innerHTML = html;
}

function gerarRelatorio() {
  const ocupados = estado.quartos.filter(Boolean).length;
  const taxaOcupacao = (ocupados / TOTAL_QUARTOS) * 100;
  const receitaTotal = estado.receitaHospedagem + estado.receitaEventos;

  pegar("dadosRelatorio").innerHTML = `
    <h3>Relatório geral do Hotel ${HOTEL}</h3>

    <table class="tabela">
      <tbody>
        <tr>
          <th>Total de reservas confirmadas</th>
          <td>${estado.reservas.length}</td>
        </tr>

        <tr>
          <th>Quartos ocupados</th>
          <td>${ocupados} de ${TOTAL_QUARTOS}</td>
        </tr>

        <tr>
          <th>Taxa de ocupação atual</th>
          <td>${taxaOcupacao.toFixed(1)}%</td>
        </tr>

        <tr>
          <th>Quantidade de hóspedes cadastrados</th>
          <td>${estado.hospedes.length}</td>
        </tr>

        <tr>
          <th>Quantidade de eventos confirmados</th>
          <td>${estado.eventos.length}</td>
        </tr>

        <tr>
          <th>Receita acumulada com hospedagem</th>
          <td>${dinheiro(estado.receitaHospedagem)}</td>
        </tr>

        <tr>
          <th>Receita acumulada com eventos</th>
          <td>${dinheiro(estado.receitaEventos)}</td>
        </tr>

        <tr>
          <th>Receita total geral</th>
          <td><strong>${dinheiro(receitaTotal)}</strong></td>
        </tr>
      </tbody>
    </table>
  `;
}