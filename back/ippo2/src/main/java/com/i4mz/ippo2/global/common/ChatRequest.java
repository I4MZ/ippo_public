//package com.i4mz.ippo2.global.common;
////Lombok 라이브러리의 어노테이션으로, 자동으로 getter, setter, equals, hashCode, toString 메소드를 생성합니다.
//import lombok.Data;
//import lombok.NoArgsConstructor;
//
//import java.util.ArrayList;
//import java.util.List;
//
//@Data
//@NoArgsConstructor
//public class ChatRequest {
//    private String model;
//    private List<Message> messages;
//    private int n;
//    private double temperature;
//
//    public ChatRequest(String model, String prompt) {
//        this.model = model;
//        this.messages = new ArrayList<>(); // ArrayList 가변
//        this.messages.add(new Message("user", prompt));
////        this.messages = List.of(new Message("user", prompt)); List 불변
//        this.temperature = 0.0;
//        this.n = 1;
//    }
//}