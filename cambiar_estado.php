<?php

include("conexion.php");


if (!isset($_GET['id']) || !isset($_GET['estado'])) {

    header("Location: pedidos.php");

    exit();

}


$id_pedido = intval($_GET['id']);
$nuevo_estado = $_GET['estado'];


$estados_permitidos = [
    "Entregado",
    "Devuelto",
    "Rechazado"
];


if (!in_array($nuevo_estado, $estados_permitidos)) {

    die("Estado no válido.");

}


$conexion->begin_transaction();


try {


    /* BUSCAR PEDIDO */

    $stmt = $conexion->prepare("
        SELECT
            id_libro,
            cantidad,
            estado
        FROM pedidos
        WHERE id_pedido = ?
        FOR UPDATE
    ");

    $stmt->bind_param("i", $id_pedido);

    $stmt->execute();

    $resultado = $stmt->get_result();


    if ($resultado->num_rows == 0) {

        throw new Exception(
            "El pedido no existe."
        );

    }


    $pedido = $resultado->fetch_assoc();

    $estado_actual = $pedido['estado'];


    /* VALIDAR CAMBIO */

    if (
        $nuevo_estado == "Entregado"
        && $estado_actual != "Aprobado"
    ) {

        throw new Exception(
            "Solo un pedido aprobado puede ser entregado."
        );

    }


    if (
        $nuevo_estado == "Devuelto"
        && $estado_actual != "Entregado"
    ) {

        throw new Exception(
            "Solo un pedido entregado puede ser devuelto."
        );

    }


    if (
        $nuevo_estado == "Rechazado"
        && $estado_actual != "Aprobado"
    ) {

        throw new Exception(
            "Solo un pedido aprobado puede ser rechazado."
        );

    }


    /* CAMBIAR ESTADO */

    $stmt = $conexion->prepare("
        UPDATE pedidos
        SET estado = ?
        WHERE id_pedido = ?
    ");

    $stmt->bind_param(
        "si",
        $nuevo_estado,
        $id_pedido
    );

    $stmt->execute();


    /*
        SI SE RECHAZA O SE DEVUELVE,
        DEVOLVEMOS EL STOCK
    */

    if (
        $nuevo_estado == "Rechazado"
        || $nuevo_estado == "Devuelto"
    ) {

        $stmt = $conexion->prepare("
            UPDATE libros
            SET stock = stock + ?
            WHERE id_libro = ?
        ");

        $stmt->bind_param(
            "ii",
            $pedido['cantidad'],
            $pedido['id_libro']
        );

        $stmt->execute();

    }


    $conexion->commit();


    header(
        "Location: pedidos.php?mensaje=Estado actualizado correctamente"
    );

    exit();


} catch (Exception $e) {

    $conexion->rollback();

    die(
        "Error: " .
        htmlspecialchars($e->getMessage())
    );

}

?>