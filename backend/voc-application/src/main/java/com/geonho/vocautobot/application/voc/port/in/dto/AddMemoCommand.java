package com.geonho.vocautobot.application.voc.port.in.dto;

/**
 * Command for adding a memo to a VOC
 */
public record AddMemoCommand(
        Long vocId,
        String content,
        boolean internal,
        Long authorId
) {
}
