package com.geonho.vocautobot.domain.voc;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("VocStatus 상태 전이 테스트")
class VocStatusTest {

    @Nested
    @DisplayName("NEW(접수) 상태에서")
    class FromNew {

        @Test
        @DisplayName("IN_PROGRESS로 전이 가능")
        void canTransitionToInProgress() {
            assertThat(VocStatus.NEW.canTransitionTo(VocStatus.IN_PROGRESS)).isTrue();
        }

        @Test
        @DisplayName("RESOLVED로 전이 가능")
        void canTransitionToResolved() {
            assertThat(VocStatus.NEW.canTransitionTo(VocStatus.RESOLVED)).isTrue();
        }

        @Test
        @DisplayName("REJECTED로 전이 가능")
        void canTransitionToRejected() {
            assertThat(VocStatus.NEW.canTransitionTo(VocStatus.REJECTED)).isTrue();
        }

        @Test
        @DisplayName("PENDING으로 전이 불가")
        void cannotTransitionToPending() {
            assertThat(VocStatus.NEW.canTransitionTo(VocStatus.PENDING)).isFalse();
        }

        @Test
        @DisplayName("CLOSED로 전이 불가")
        void cannotTransitionToClosed() {
            assertThat(VocStatus.NEW.canTransitionTo(VocStatus.CLOSED)).isFalse();
        }
    }

    @Nested
    @DisplayName("IN_PROGRESS(처리중) 상태에서")
    class FromInProgress {

        @Test
        @DisplayName("RESOLVED로 전이 가능")
        void canTransitionToResolved() {
            assertThat(VocStatus.IN_PROGRESS.canTransitionTo(VocStatus.RESOLVED)).isTrue();
        }

        @Test
        @DisplayName("REJECTED로 전이 가능")
        void canTransitionToRejected() {
            assertThat(VocStatus.IN_PROGRESS.canTransitionTo(VocStatus.REJECTED)).isTrue();
        }

        @Test
        @DisplayName("NEW로 전이 불가")
        void cannotTransitionToNew() {
            assertThat(VocStatus.IN_PROGRESS.canTransitionTo(VocStatus.NEW)).isFalse();
        }

        @Test
        @DisplayName("PENDING으로 전이 불가")
        void cannotTransitionToPending() {
            assertThat(VocStatus.IN_PROGRESS.canTransitionTo(VocStatus.PENDING)).isFalse();
        }

        @Test
        @DisplayName("CLOSED로 전이 불가")
        void cannotTransitionToClosed() {
            assertThat(VocStatus.IN_PROGRESS.canTransitionTo(VocStatus.CLOSED)).isFalse();
        }
    }

    @Nested
    @DisplayName("RESOLVED(완료) 상태에서")
    class FromResolved {

        @ParameterizedTest
        @EnumSource(VocStatus.class)
        @DisplayName("어떤 상태로도 전이 불가")
        void cannotTransitionToAnyStatus(VocStatus target) {
            assertThat(VocStatus.RESOLVED.canTransitionTo(target)).isFalse();
        }
    }

    @Nested
    @DisplayName("REJECTED(반려) 상태에서")
    class FromRejected {

        @ParameterizedTest
        @EnumSource(VocStatus.class)
        @DisplayName("어떤 상태로도 전이 불가")
        void cannotTransitionToAnyStatus(VocStatus target) {
            assertThat(VocStatus.REJECTED.canTransitionTo(target)).isFalse();
        }
    }

    @Nested
    @DisplayName("CLOSED(종료) 상태에서")
    class FromClosed {

        @ParameterizedTest
        @EnumSource(VocStatus.class)
        @DisplayName("어떤 상태로도 전이 불가")
        void cannotTransitionToAnyStatus(VocStatus target) {
            assertThat(VocStatus.CLOSED.canTransitionTo(target)).isFalse();
        }
    }

    @Nested
    @DisplayName("PENDING(보류) 상태에서 - 레거시 호환")
    class FromPending {

        @Test
        @DisplayName("RESOLVED로 전이 가능")
        void canTransitionToResolved() {
            assertThat(VocStatus.PENDING.canTransitionTo(VocStatus.RESOLVED)).isTrue();
        }

        @Test
        @DisplayName("REJECTED로 전이 가능")
        void canTransitionToRejected() {
            assertThat(VocStatus.PENDING.canTransitionTo(VocStatus.REJECTED)).isTrue();
        }
    }

    @Nested
    @DisplayName("자기 자신으로의 전이")
    class SelfTransition {

        @ParameterizedTest
        @EnumSource(VocStatus.class)
        @DisplayName("같은 상태로 전이 불가")
        void cannotTransitionToSameStatus(VocStatus status) {
            assertThat(status.canTransitionTo(status)).isFalse();
        }
    }

    @Nested
    @DisplayName("isTerminal() 메서드")
    class IsTerminal {

        @Test
        @DisplayName("RESOLVED는 최종 상태")
        void resolvedIsTerminal() {
            assertThat(VocStatus.RESOLVED.isTerminal()).isTrue();
        }

        @Test
        @DisplayName("REJECTED는 최종 상태")
        void rejectedIsTerminal() {
            assertThat(VocStatus.REJECTED.isTerminal()).isTrue();
        }

        @Test
        @DisplayName("CLOSED는 최종 상태")
        void closedIsTerminal() {
            assertThat(VocStatus.CLOSED.isTerminal()).isTrue();
        }

        @Test
        @DisplayName("NEW는 최종 상태가 아님")
        void newIsNotTerminal() {
            assertThat(VocStatus.NEW.isTerminal()).isFalse();
        }

        @Test
        @DisplayName("IN_PROGRESS는 최종 상태가 아님")
        void inProgressIsNotTerminal() {
            assertThat(VocStatus.IN_PROGRESS.isTerminal()).isFalse();
        }

        @Test
        @DisplayName("PENDING는 최종 상태가 아님")
        void pendingIsNotTerminal() {
            assertThat(VocStatus.PENDING.isTerminal()).isFalse();
        }
    }
}
