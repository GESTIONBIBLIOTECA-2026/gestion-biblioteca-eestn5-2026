<?php

include("conexion.php");

if ($_SERVER["REQUEST_METHOD"] != "POST") {
    header("Location: crear_pedido.php");
    exit();
}


$id_usuario = intval($_POST['id_usuario']);
$id_libro = intval($_POST['id_libro']);
$cantidad = intval($_POST['cantidad']);
$fecha_pedido = $_POST['fecha_pedido'];
$fecha_devolucion = $_POST['fecha_devolucion'];


/* VALIDAR CANTIDAD */

if ($cantidad <= 0) {

    die("La cantidad debe ser mayor a 0.");

}


/* VALIDAR FECHAS */

if ($fecha_devolucion < $fecha_pedido) {

    die("La fecha de devolución no puede ser anterior a la fecha del pedido.");

}


$conexion->begin_transaction();

try {


    /* BUSCAR USUARIO */

    $stmt = $conexion->prepare("
        SELECT habilitado
        FROM usuarios
        WHERE id_usuario = ?
        FOR UPDATE
    ");

    $stmt->bind_param("i", $id_usuario);

    $stmt->execute();

    $resultado = $stmt->get_result();


    if ($resultado->num_rows == 0) {

        throw new Exception("El usuario no existe.");

    }


    $usuario = $resultado->fetch_assoc();


    /* VALIDAR USUARIO */

    if ($usuario['habilitado'] != 1) {

        throw new Exception(
            "El usuario no está habilitado para realizar pedidos."
        );

    }


    /* BUSCAR LIBRO */

    $stmt = $conexion->prepare("
        SELECT stock
        FROM libros
        WHERE id_libro = ?
        FOR UPDATE
    ");

    $stmt->bind_param("i", $id_libro);

    $stmt->execute();

    $resultado = $stmt->get_result();


    if ($resultado->num_rows == 0) {

        throw new Exception("El libro no existe.");

    }


    $libro = $resultado->fetch_assoc();


    /* VALIDAR STOCK */

    if ($libro['stock'] < $cantidad) {

        throw new Exception(
            "No hay suficiente stock disponible."
        );

    }


    /* INSERTAR PEDIDO */

    $estado = "Aprobado";

    $stmt = $conexion->prepare("
        INSERT INTO pedidos
        (
            id_usuario,
            id_libro,
            cantidad,
            fecha_pedido,
            fecha_devolucion,
            estado
        )
        VALUES (?, ?, ?, ?, ?, ?)
    ");

    $stmt->bind_param(
        "iiisss",
        $id_usuario,
        $id_libro,
        $cantidad,
        $fecha_pedido,
        $fecha_devolucion,
        $estado
    );


    if (!$stmt->execute()) {

        throw new Exception(
            "No se pudo registrar el pedido."
        );

    }


    /* DESCONTAR STOCK */

    $stmt = $conexion->prepare("
        UPDATE libros
        SET stock = stock - ?
        WHERE id_libro = ?
    ");

    $stmt->bind_param(
        "ii",
        $cantidad,
        $id_libro
    );

    $stmt->execute();


    /* CONFIRMAR */

    $conexion->commit();


    header("Location: pedidos.php?mensaje=Pedido registrado correctamente");

    exit();


} catch (Exception $e) {

    $conexion->rollback();

    ?>

    <!DOCTYPE html>
    <html lang="es">

    <head>

        <meta charset="UTF-8">

        <title>Error — Biblioteca Invaluable</title>

        <link rel="stylesheet" href="style.css">

    </head>

    <body>

    <header class="barra-navegacion">

        <div class="barra-interior">

            <div class="barra-izquierda">

                <a class="nombre-biblioteca"
                   href="index.php">

                    Biblioteca Invaluable

                </a>

                <span class="separador">|</span>

                <span class="seccion-nombre">

                    Panel de Administración

                </span>

            </div>

        </div>

    </header>


    <main class="contenedor">

        <div class="encabezado-pagina">

            <div>

                <h1 class="titulo-pagina">

                    ⚠️ Error

                </h1>

            </div>

        </div>


        <section class="seccion">

            <div class="tarjeta">

                <div class="cuerpo-tarjeta">

                    <p>

                        <?php echo htmlspecialchars($e->getMessage()); ?>

                    </p>

                    <br>

                    <a
                        href="crear_pedido.php"
                        class="boton boton-principal">

                        Volver

                    </a>

                </div>

            </div>

        </section>

    </main>

    </body>

    </html>

    <?php
}
?>