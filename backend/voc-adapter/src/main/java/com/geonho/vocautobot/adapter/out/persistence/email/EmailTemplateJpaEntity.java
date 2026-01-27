package com.geonho.vocautobot.adapter.out.persistence.email;

import com.geonho.vocautobot.adapter.out.persistence.common.BaseJpaEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "email_templates")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmailTemplateJpaEntity extends BaseJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    @Column(name = "subject", nullable = false, length = 200)
    private String subject;

    @Column(name = "body", nullable = false, columnDefinition = "TEXT")
    private String body;

    @ElementCollection
    @CollectionTable(
            name = "email_template_variables",
            joinColumns = @JoinColumn(name = "template_id")
    )
    @Column(name = "variable_name", length = 50)
    private List<String> variables = new ArrayList<>();

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    public EmailTemplateJpaEntity(String name, String subject, String body,
                                 List<String> variables, boolean isActive) {
        this.name = name;
        this.subject = subject;
        this.body = body;
        this.variables = variables != null ? new ArrayList<>(variables) : new ArrayList<>();
        this.isActive = isActive;
    }

    public void update(String name, String subject, String body, List<String> variables) {
        if (name != null) {
            this.name = name;
        }
        if (subject != null) {
            this.subject = subject;
        }
        if (body != null) {
            this.body = body;
        }
        if (variables != null) {
            this.variables.clear();
            this.variables.addAll(variables);
        }
    }

    public void activate() {
        this.isActive = true;
    }

    public void deactivate() {
        this.isActive = false;
    }
}
