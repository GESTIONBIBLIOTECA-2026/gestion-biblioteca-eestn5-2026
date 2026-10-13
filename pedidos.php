<?php

include("conexion.php");

$mensaje = "";

if (isset($_GET['mensaje'])) {
    $mensaje = $_GET['mensaje'];
}

$consulta = "
    SELECT
        p.id_pedido,
        u.nombre AS usuario,
        l.titulo AS libro,
        p.cantidad,
        p.fecha_pedido,
        p.fecha_devolucion,
        p.estado,
        p.motivo_rechazo
    FROM pedidos p

    INNER JOIN usuarios u
        ON p.id_usuario = u.id_usuario

    INNER JOIN libros l
        ON p.id_libro = l.id_libro

    ORDER BY p.id_pedido DESC
";

$resultado = $conexion->query($consulta);

?>

<!DOCTYPE html>
<html lang="es">

<head>

    <meta charset="UTF-8">

    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

    <title>Pedidos — Biblioteca Invaluable</title>

    <link rel="stylesheet" href="style.css">

</head>

<body>


<header class="barra-navegacion">

    <div class="barra-interior">

        <div class="barra-izquierda">

            <a
                class="nombre-biblioteca"
                href="index.php">

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

                <a href="index.php">
                    Inicio
                </a>

            </div>

        </details>

    </div>

</header>


<main class="contenedor">


    <div class="encabezado-pagina">

        <div>

            <h1 class="titulo-pagina">

                <span class="icono-grande">
                    📋
                </span>

                Pedidos

            </h1>

            <p>
                Consulta y controla los pedidos registrados.
            </p>

        </div>


        <a
            href="crear_pedido.php"
            class="boton boton-principal">

            + Nuevo Pedido

        </a>

    </div>


    <?php if ($mensaje != ""): ?>

        <section class="seccion">

            <div class="tarjeta">

                <div class="cuerpo-tarjeta">

                    <p>
                        <?php echo htmlspecialchars($mensaje); ?>
                    </p>

                </div>

            </div>

        </section>

    <?php endif; ?>


    <section class="seccion">

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
                                <th>Pedido</th>
                                <th>Devolución</th>
                                <th>Estado</th>
                                <th>Acciones</th>

                            </tr>

                        </thead>


                        <tbody>

                        <?php if ($resultado->num_rows > 0): ?>

                            <?php while ($pedido = $resultado->fetch_assoc()): ?>

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
                                        <?php echo $pedido['fecha_devolucion']; ?>
                                    </td>

                                    <td>

                                        <span class="etiqueta">

                                            <?php echo $pedido['estado']; ?>

                                        </span>

                                    </td>


                                    <td>

                                        <div class="acciones-tabla">

                                            <?php if ($pedido['estado'] == 'Aprobado'): ?>

                                                <a
                                                    href="cambiar_estado.php?id=<?php echo $pedido['id_pedido']; ?>&estado=Entregado"
                                                    class="boton boton-secundario">

                                                    Entregar

                                                </a>

                                                <a
                                                    href="cambiar_estado.php?id=<?php echo $pedido['id_pedido']; ?>&estado=Rechazado"
                                                    class="boton boton-eliminar">

                                                    Rechazar

                                                </a>

                                            <?php elseif ($pedido['estado'] == 'Entregado'): ?>

                                                <a
                                                    href="cambiar_estado.php?id=<?php echo $pedido['id_pedido']; ?>&estado=Devuelto"
                                                    class="boton boton-principal">

                                                    Marcar Devuelto

                                                </a>

                                            <?php elseif ($pedido['estado'] == 'Devuelto'): ?>

                                                <span>
                                                    Finalizado
                                                </span>

                                            <?php elseif ($pedido['estado'] == 'Rechazado'): ?>

                                                <span>
                                                    Rechazado
                                                </span>

                                            <?php endif; ?>

                                        </div>

                                    </td>

                                </tr>

                            <?php endwhile; ?>

                        <?php else: ?>

                            <tr>

                                <td colspan="8">

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