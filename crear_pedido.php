<?php
include("conexion.php");

$usuarios = $conexion->query("
    SELECT id_usuario, nombre FROM usuarios
    WHERE habilitado = 1 ORDER BY nombre
")->fetch_all(MYSQLI_ASSOC);

$libros = $conexion->query("
    SELECT id_libro, titulo, autor, editorial, stock
    FROM libros
    WHERE stock > 0 ORDER BY titulo
")->fetch_all(MYSQLI_ASSOC);
?>

<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nuevo Pedido — Biblioteca Invaluable</title>
<link rel="stylesheet" href="style.css">

<style>
.buscador{position:relative}
.resultados{
    position:absolute;top:100%;left:0;width:100%;
    background:white;z-index:10;max-height:220px;
    overflow-y:auto;box-shadow:0 3px 10px #aaa
}
.resultados button{
    display:block;width:100%;padding:10px;
    border:0;text-align:left;background:white;cursor:pointer;
    color:#1f2937;border-bottom:1px solid #eee
}
.resultados button:hover{background:#eee}
.filtros{
    display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
    gap:10px;margin-bottom:12px
}
#stock{background:#f0f2f5}
.detalle-libro{font-size:12px;color:#6b7280}
</style>
</head>

<body>

<header class="barra-navegacion">
<div class="barra-interior">
<div class="barra-izquierda">
<a class="nombre-biblioteca" href="index.php">Biblioteca Invaluable</a>
<span class="separador">|</span>
<span class="seccion-nombre">Panel de Administración</span>
</div>
<details class="menu-usuario">
<summary>👤 Admin</summary>
<div class="menu-desplegable"><a href="index.php">Inicio</a></div>
</details>
</div>
</header>

<main class="contenedor">
<div class="encabezado-pagina">
<h1 class="titulo-pagina">📋 Nuevo Pedido</h1>
<p>Registra un nuevo pedido de libros.</p>
</div>

<section class="seccion">
<div class="tarjeta">
<div class="cuerpo-tarjeta">

<form action="guardar_pedido.php" method="POST"
class="formulario-grid" id="form">

<!-- BUSCADOR DE USUARIOS -->
<div class="grupo-formulario">
<label class="etiqueta-formulario">Usuario</label>
<div class="buscador">
<input type="text" id="buscarUsuario"
class="campo-formulario"
placeholder="Escribí el nombre del usuario..."
autocomplete="off" required>
<input type="hidden" name="id_usuario" id="idUsuario">
<div id="resultadosUsuarios" class="resultados"></div>
</div>
</div>

<!-- BUSCADOR Y FILTROS DE LIBROS -->
<div class="grupo-formulario">
<label class="etiqueta-formulario">Buscar libro</label>

<div class="filtros">
<input type="text" id="buscarLibro"
class="campo-formulario"
placeholder="Buscar por título...">

<input type="text" id="buscarAutor"
class="campo-formulario"
placeholder="Filtrar por autor...">

<input type="text" id="buscarEditorial"
class="campo-formulario"
placeholder="Filtrar por editorial...">
</div>

<div class="buscador">
<input type="text" id="libroSeleccionado"
class="campo-formulario"
placeholder="Seleccioná un libro de los resultados..."
autocomplete="off" required>
<input type="hidden" name="id_libro" id="idLibro">
<div id="resultadosLibros" class="resultados"></div>
</div>
</div>

<!-- STOCK -->
<div class="grupo-formulario">
<label class="etiqueta-formulario">Stock disponible</label>
<input type="text" id="stock" class="campo-formulario"
placeholder="Seleccioná un libro" readonly>
</div>

<!-- CANTIDAD -->
<div class="grupo-formulario">
<label class="etiqueta-formulario">Cantidad</label>
<input type="number" name="cantidad" id="cantidad"
class="campo-formulario" min="1" required>
</div>

<!-- FECHAS -->
<div class="grupo-formulario">
<label class="etiqueta-formulario">Fecha de pedido</label>
<input type="date" name="fecha_pedido"
class="campo-formulario"
value="<?= date('Y-m-d') ?>" required>
</div>

<div class="grupo-formulario">
<label class="etiqueta-formulario">Fecha de devolución</label>
<input type="date" name="fecha_devolucion"
class="campo-formulario"
min="<?= date('Y-m-d') ?>" required>
</div>

<div class="acciones-formulario">
<a href="index.php" class="boton boton-secundario">Cancelar</a>
<button type="submit" class="boton boton-principal">
Guardar Pedido
</button>
</div>

</form>
</div>
</div>
</section>
</main>

<footer class="pie-pagina">
<div class="pie-interior">
Sistema de Gestión de Biblioteca · Módulo de Gestión de Pedidos · Grupo 4
</div>
</footer>

<script>
const usuarios = <?= json_encode($usuarios, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>;
const libros = <?= json_encode($libros, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>;

const buscarUsuario = document.getElementById('buscarUsuario');
const idUsuario = document.getElementById('idUsuario');
const resultadosUsuarios = document.getElementById('resultadosUsuarios');

const buscarLibro = document.getElementById('buscarLibro');
const buscarAutor = document.getElementById('buscarAutor');
const buscarEditorial = document.getElementById('buscarEditorial');
const libroSeleccionado = document.getElementById('libroSeleccionado');
const idLibro = document.getElementById('idLibro');
const resultadosLibros = document.getElementById('resultadosLibros');
const stock = document.getElementById('stock');
const cantidad = document.getElementById('cantidad');

// BUSCAR USUARIOS
buscarUsuario.addEventListener('input', () => {
    idUsuario.value = '';
    resultadosUsuarios.innerHTML = '';

    const texto = buscarUsuario.value.trim().toLowerCase();
    if (!texto) return;

    const encontrados = usuarios.filter(u =>
        u.nombre.toLowerCase().includes(texto)
    );

    encontrados.forEach(u => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = u.nombre;
        b.onclick = () => {
            buscarUsuario.value = u.nombre;
            idUsuario.value = u.id_usuario;
            resultadosUsuarios.innerHTML = '';
        };
        resultadosUsuarios.appendChild(b);
    });

    if (!encontrados.length)
        resultadosUsuarios.textContent = 'No se encontraron usuarios.';
});

// BUSCAR Y FILTRAR LIBROS
function filtrarLibros() {
    idLibro.value = '';
    libroSeleccionado.value = '';
    stock.value = '';
    cantidad.value = '';
    cantidad.max = '';
    resultadosLibros.innerHTML = '';

    const titulo = buscarLibro.value.trim().toLowerCase();
    const autor = buscarAutor.value.trim().toLowerCase();
    const editorial = buscarEditorial.value.trim().toLowerCase();

    const encontrados = libros.filter(l =>
        (l.titulo || '').toLowerCase().includes(titulo) &&
        (l.autor || '').toLowerCase().includes(autor) &&
        (l.editorial || '').toLowerCase().includes(editorial)
    );

    encontrados.forEach(l => {
        const b = document.createElement('button');
        b.type = 'button';

        b.innerHTML = '';

        const nombre = document.createElement('strong');
        nombre.textContent = l.titulo;
        b.appendChild(nombre);

        const detalle = document.createElement('div');
        detalle.className = 'detalle-libro';
        detalle.textContent =
            'Autor: ' + (l.autor || 'Sin autor') +
            ' | Editorial: ' + (l.editorial || 'Sin editorial') +
            ' | Stock: ' + l.stock;

        b.appendChild(detalle);

        b.onclick = () => {
            libroSeleccionado.value = l.titulo;
            idLibro.value = l.id_libro;
            stock.value = l.stock + ' ejemplares';
            cantidad.max = l.stock;
            cantidad.value = '';
            cantidad.setCustomValidity('');
            resultadosLibros.innerHTML = '';
        };

        resultadosLibros.appendChild(b);
    });

    if (!encontrados.length)
        resultadosLibros.textContent = 'No se encontraron libros.';
}

buscarLibro.addEventListener('input', filtrarLibros);
buscarAutor.addEventListener('input', filtrarLibros);
buscarEditorial.addEventListener('input', filtrarLibros);

// CAMBIAR EL LIBRO SELECCIONADO
libroSeleccionado.addEventListener('input', () => {
    idLibro.value = '';
    stock.value = '';
    cantidad.value = '';
    cantidad.max = '';

    buscarLibro.value = libroSeleccionado.value;
    buscarAutor.value = '';
    buscarEditorial.value = '';
    filtrarLibros();
});

// CERRAR RESULTADOS AL HACER CLIC AFUERA
document.addEventListener('click', e => {
    if (!e.target.closest('.buscador')) {
        resultadosUsuarios.innerHTML = '';
        resultadosLibros.innerHTML = '';
    }
});

// VALIDAR CANTIDAD
cantidad.addEventListener('input', () => {
    cantidad.setCustomValidity(
        idLibro.value &&
        (Number(cantidad.value) < 1 ||
         Number(cantidad.value) > Number(cantidad.max))
        ? 'Ingresá una cantidad válida según el stock disponible.'
        : ''
    );
});

// VALIDAR ANTES DE GUARDAR
document.getElementById('form').addEventListener('submit', e => {
    if (!idUsuario.value) {
        e.preventDefault();
        alert('Buscá y seleccioná un usuario.');
        buscarUsuario.focus();
        return;
    }

    if (!idLibro.value) {
        e.preventDefault();
        alert('Buscá y seleccioná un libro de los resultados.');
        libroSeleccionado.focus();
        return;
    }

    if (Number(cantidad.value) < 1 ||
        Number(cantidad.value) > Number(cantidad.max)) {
        e.preventDefault();
        alert('La cantidad debe estar dentro del stock disponible.');
        cantidad.focus();
    }
});
</script>

</body>
</html>
