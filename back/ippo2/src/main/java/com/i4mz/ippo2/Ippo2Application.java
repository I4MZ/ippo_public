package com.i4mz.ippo2;
//시작을 담당하는 파일
// 스프링부트의 모든 설정이 관리됨
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;

@SpringBootApplication(exclude = SecurityAutoConfiguration.class)
public class Ippo2Application {
    public static void main(String[] args) {
        SpringApplication.run(Ippo2Application.class, args);
    }

}
