/*
 * 손동작 인식 스마트 조명 - 아두이노 코드
 * 피지컬 AI 프로젝트 | 인공지능과 피지컬컴퓨팅
 *
 * 시리얼로 문자를 받아 LED를 제어합니다.
 * 'R' → 빨간 LED ON
 * 'G' → 초록 LED ON
 * 'B' → 파란 LED ON
 * 'O' → 모든 LED OFF
 */

const int RED_PIN   = 9;
const int GREEN_PIN = 10;
const int BLUE_PIN  = 11;

void setup() {
  Serial.begin(9600);

  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);

  // 시작 시 LED 깜빡여서 연결 확인
  for (int i = 0; i < 3; i++) {
    digitalWrite(RED_PIN, HIGH);
    digitalWrite(GREEN_PIN, HIGH);
    digitalWrite(BLUE_PIN, HIGH);
    delay(200);
    digitalWrite(RED_PIN, LOW);
    digitalWrite(GREEN_PIN, LOW);
    digitalWrite(BLUE_PIN, LOW);
    delay(200);
  }
}

void loop() {
  if (Serial.available() > 0) {
    char cmd = Serial.read();

    // 모든 LED 끄기
    digitalWrite(RED_PIN, LOW);
    digitalWrite(GREEN_PIN, LOW);
    digitalWrite(BLUE_PIN, LOW);

    // 받은 명령에 따라 해당 LED 켜기
    switch (cmd) {
      case 'R':
        digitalWrite(RED_PIN, HIGH);
        break;
      case 'G':
        digitalWrite(GREEN_PIN, HIGH);
        break;
      case 'B':
        digitalWrite(BLUE_PIN, HIGH);
        break;
      case 'O':
        // 이미 전부 꺼져 있음
        break;
    }
  }
}