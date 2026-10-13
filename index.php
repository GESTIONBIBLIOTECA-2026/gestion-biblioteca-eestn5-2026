<?php
include("conexion.php");

$total_pedidos = 0;
$aprobados = 0;
$pendientes = 0;
$atrasados = 0;

$resultado = $conexion->query("SELECT COUNT(*) AS total FROM pedidos");
if ($resultado) {
    $fila = $resultado->fetch_assoc();
    $total_pedidos = $fila['total'];
}

$resultado = $conexion->query("SELECT COUNT(*) AS total FROM pedidos WHERE estado = 'Aprobado'");
if ($resultado) {
    $fila = $resultado->fetch_assoc();
    $aprobados = $fila['total'];
}

$resultado = $conexion->query("SELECT COUNT(*) AS total FROM pedidos WHERE estado = 'Pendiente'");
if ($resultado) {
    $fila = $resultado->fetch_assoc();
    $pendientes = $fila['total'];
}

$resultado = $conexion->query("
    SELECT COUNT(*) AS total
    FROM pedidos
    WHERE fecha_devolucion < CURDATE()
    AND estado NOT IN ('Devuelto', 'Rechazado')
");

if ($resultado) {
    $fila = $resultado->fetch_assoc();
    $atrasados = $fila['total'];
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Gestión de Pedidos — Biblioteca Invaluable</title>

    <link rel="stylesheet" href="style.css">
</head>

<body>

<header class="barra-navegacion">

    <div class="barra-interior">

        <div class="barra-izquierda">

            <a class="nombre-biblioteca" href="index.php">
                Biblioteca Invaluable
            </a>

            <span class="separador">|</span>

            <span class="seccion-nombre">
                Panel de Administración
            </span>

        </div>

        <details class="menu-usuario">

            <summary>
                👤 Admin
            </summary>

            <div class="menu-desplegable">

                <a href="#">Mi perfil</a>

                <a href="#">
                    Cerrar sesión
                </a>

            </div>

        </details>

    </div>

</header>


<main class="contenedor">

    <div class="encabezado-pagina">

        <div>

            <h1 class="titulo-pagina">

                <span class="icono-grande">📚</span>

                Gestión de Pedidos

            </h1>

            <p>
                Gestiona y coordina los pedidos de libros de la biblioteca.
            </p>

        </div>

        <a href="crear_pedido.php" class="boton boton-principal">
            + Nuevo Pedido
        </a>

    </div>


    <!-- RESUMEN -->

    <section class="seccion">

        <h2 class="titulo-seccion">
            Resumen de Pedidos
        </h2>

        <div class="resumen-grid">

            <div class="tarjeta-resumen">

                <div class="encabezado-resumen">
                    Total de Pedidos
                </div>

                <div class="numero-resumen">
                    <?php echo $total_pedidos; ?>
                </div>

            </div>


            <div class="tarjeta-resumen">

                <div class="encabezado-resumen">
                    Pedidos Aprobados
                </div>

                <div class="numero-resumen">
                    <?php echo $aprobados; ?>
                </div>

            </div>


            <div class="tarjeta-resumen">

                <div class="encabezado-resumen">
                    Pedidos Pendientes
                </div>

                <div class="numero-resumen">
                    <?php echo $pendientes; ?>
                </div>

            </div>


            <div class="tarjeta-resumen">

                <div class="encabezado-resumen">
                    Atrasos Activos
                </div>

                <div class="numero-resumen">
                    <?php echo $atrasados; ?>
                </div>

            </div>

        </div>

    </section>


    <!-- ACCIONES -->

    <section class="seccion">

        <h2 class="titulo-seccion">
            Gestión de Pedidos
        </h2>

        <div class="resumen-grid">

            <div class="tarjeta tarjeta-ancha">

                <div class="cuerpo-tarjeta">

                    <h3>
                        📋 Crear un pedido
                    </h3>

                    <p>
                        Registrar un nuevo pedido indicando usuario,
                        libro, cantidad y fecha de devolución.
                    </p>

                    <a href="crear_pedido.php"
                       class="boton boton-principal">

                        Nuevo Pedido

                    </a>

                </div>

            </div>


            <div class="tarjeta tarjeta-ancha">

                <div class="cuerpo-tarjeta">

                    <h3>
                        🔎 Consultar pedidos
                    </h3>

                    <p>
                        Ver los pedidos registrados y controlar
                        su estado.
                    </p>

                    <a href="pedidos.php"
                       class="boton boton-secundario">

                        Ver Pedidos

                    </a>

                </div>

            </div>


            <div class="tarjeta tarjeta-ancha">

                <div class="cuerpo-tarjeta">

                    <h3>
                        📖 Historial
                    </h3>

                    <p>
                        Consultar el historial completo de pedidos
                        realizados.
                    </p>

                    <a href="historial.php"
                       class="boton boton-secundario">

                        Ver Historial

                    </a>

                </div>

            </div>

        </div>

    </section>


    <!-- ÚLTIMOS PEDIDOS -->

    <section class="seccion">

        <h2 class="titulo-seccion">
            Pedidos Recientes
        </h2>

        <div class="tarjeta">

            <div class="cuerpo-tarjeta">

                <div class="contenedor-tabla">

                    <table class="tabla">

                        <thead>

                            <tr>

                                <th>ID</th>
                                <th>Usuario</th>
                                <th>Libro</th>
                                <th>Cantidad</th>
                                <th>Fecha</th>
                                <th>Estado</th>

                            </tr>

                        </thead>

                        <tbody>

                        <?php

                        $consulta = "
                            SELECT
                                p.id_pedido,
                                u.nombre AS usuario,
                                l.titulo AS libro,
                                p.cantidad,
                                p.fecha_pedido,
                                p.estado
                            FROM pedidos p

                            INNER JOIN usuarios u
                                ON p.id_usuario = u.id_usuario

                            INNER JOIN libros l
                                ON p.id_libro = l.id_libro

                            ORDER BY p.id_pedido DESC

                            LIMIT 5
                        ";

                        $resultado = $conexion->query($consulta);

                        if ($resultado && $resultado->num_rows > 0):

                            while ($pedido = $resultado->fetch_assoc()):

                        ?>

                            <tr>

                                <td>
                                    <?php echo $pedido['id_pedido']; ?>
                                </td>

                                <td>
                                    <?php echo htmlspecialchars($pedido['usuario']); ?>
                                </td>

                                <td>
                                    <?php echo htmlspecialchars($pedido['libro']); ?>
                                </td>

                                <td>
                                    <?php echo $pedido['cantidad']; ?>
                                </td>

                                <td>
                                    <?php echo $pedido['fecha_pedido']; ?>
                                </td>

                                <td>

                                    <span class="etiqueta">

                                        <?php echo $pedido['estado']; ?>

                                    </span>

                                </td>

                            </tr>

                        <?php

                            endwhile;

                        else:

                        ?>

                            <tr>

                                <td colspan="6">

                                    No hay pedidos registrados.

                                </td>

                            </tr>

                        <?php endif; ?>

                        </tbody>

                    </table>

                </div>

            </div>

        </div>

    </section>

</main>


<footer class="pie-pagina">

    <div class="pie-interior">

        Sistema de Gestión de Biblioteca ·
        Módulo de Gestión de Pedidos ·
        Grupo 4

    </div>

</footer>

</body>
</html>