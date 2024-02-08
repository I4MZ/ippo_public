package com.i4mz.ippo2.domain.doduk.dto;

import lombok.Data;
import org.springframework.http.HttpStatus;

@Data
public class DodukResponseDto {

    private int status;
    private String message;
    private Object data;

    public DodukResponseDto(HttpStatus status, String message, Object data) {

        this.status = status.value();
        this.message = message;
        this.data = data;

    }
}