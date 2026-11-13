# %% [markdown]
# # 🧠 CNN으로 손글씨 숫자 인식하기 (MNIST)
# **인공지능과 피지컬컴퓨팅 수업 실습자료**
#
# 이 노트북에서는 합성곱 신경망(CNN)을 사용하여
# 손으로 쓴 숫자(0~9)를 인식하는 AI 모델을 직접 만들어봅니다.
#
# 📌 수업 슬라이드 11~13과 함께 진행하세요!

# %%
# ============================================================
# 📦 Cell 1: 환경 설정 - 필요한 라이브러리 불러오기
# ============================================================

# 한글 폰트 설치 (Colab 환경)
import subprocess
subprocess.run(['apt-get', '-qq', '-y', 'install', 'fonts-nanum'], capture_output=True)

import matplotlib
import matplotlib.font_manager as fm

# 나눔고딕 폰트 경로 찾기 및 등록
font_path = '/usr/share/fonts/truetype/nanum/NanumGothic.ttf'
fm.fontManager.addfont(font_path)
matplotlib.rcParams['font.family'] = 'NanumGothic'
matplotlib.rcParams['axes.unicode_minus'] = False  # 마이너스 부호 깨짐 방지

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np
import matplotlib.pyplot as plt

print("✅ 한글 폰트 설치 완료!")
print(f"TensorFlow 버전: {tf.__version__}")
print(f"GPU 사용 가능: {tf.config.list_physical_devices('GPU')}")

# %%
# ============================================================
# 🔢 Cell 2: MNIST 데이터 불러오기
# ============================================================
# MNIST: 0~9 손글씨 숫자 이미지 70,000장 (훈련 60,000 + 테스트 10,000)
# 각 이미지는 28x28 픽셀, 흑백(grayscale)

(x_train, y_train), (x_test, y_test) = keras.datasets.mnist.load_data()

print(f"훈련 데이터: {x_train.shape} (이미지 {x_train.shape[0]}장, {x_train.shape[1]}x{x_train.shape[2]} 픽셀)")
print(f"테스트 데이터: {x_test.shape} (이미지 {x_test.shape[0]}장)")
print(f"레이블 종류: {np.unique(y_train)} (0~9 숫자)")

# %%
# ============================================================
# 👁️ Cell 3: 데이터 시각화 - MNIST 이미지 살펴보기
# ============================================================
# 실제 데이터가 어떻게 생겼는지 눈으로 확인해봅시다!

fig, axes = plt.subplots(2, 10, figsize=(15, 4))
fig.suptitle('MNIST 숫자 이미지 샘플', fontsize=14, fontweight='bold')

for digit in range(10):
    # 각 숫자별 첫 번째 샘플
    idx = np.where(y_train == digit)[0][0]
    axes[0][digit].imshow(x_train[idx], cmap='gray')
    axes[0][digit].set_title(f'{digit}', fontweight='bold')
    axes[0][digit].axis('off')

    # 각 숫자별 두 번째 샘플 (다양성 확인)
    idx2 = np.where(y_train == digit)[0][1]
    axes[1][digit].imshow(x_train[idx2], cmap='gray')
    axes[1][digit].axis('off')

plt.tight_layout()
plt.show()

# 한 이미지의 픽셀값 확인
print("\n📊 숫자 '5'의 픽셀값 (28x28):")
sample_idx = np.where(y_train == 5)[0][0]
print(f"최솟값: {x_train[sample_idx].min()}, 최댓값: {x_train[sample_idx].max()}")

# %%
# ============================================================
# ⚙️ Cell 4: 데이터 전처리
# ============================================================
# AI 모델이 학습하기 좋은 형태로 데이터를 변환합니다.

# 1. 픽셀값 정규화 (0~255 → 0~1)
#    컴퓨터는 0~1 사이의 작은 숫자를 더 잘 학습합니다!
x_train = x_train.astype('float32') / 255.0
x_test = x_test.astype('float32') / 255.0

# 2. CNN 입력 형태로 변환 (28, 28) → (28, 28, 1)
#    마지막 1은 채널 수 (흑백=1, 컬러=3)
x_train = x_train.reshape(-1, 28, 28, 1)
x_test = x_test.reshape(-1, 28, 28, 1)

print(f"전처리 후 훈련 데이터 형태: {x_train.shape}")
print(f"전처리 후 테스트 데이터 형태: {x_test.shape}")
print(f"픽셀값 범위: {x_train.min():.1f} ~ {x_train.max():.1f}")

# %%
# ============================================================
# 🧠 Cell 5: CNN 모델 구성하기
# ============================================================
# 수업에서 배운 CNN 구조를 코드로 구현합니다!
#
# [입력] → [Conv → Pool] → [Conv → Pool] → [Flatten → Dense] → [출력]
#  28x28     특징 추출        패턴 감지        분류 판단         0~9 확률

model = keras.Sequential([
    # === 특징 추출부 (Feature Extraction) ===

    # 1단계: 컨볼루션 + 활성화함수
    # 5x5 크기의 필터 32개가 이미지를 스캔하며 특징(가장자리, 곡선 등)을 추출
    # 💡 5x5 필터는 3x3보다 넓은 영역을 한 번에 보므로 손글씨 같은 큰 패턴 인식에 유리!
    layers.Conv2D(32, (5, 5), activation='relu', padding='same',
                  input_shape=(28, 28, 1), name='conv1'),

    # 2단계: 풀링 (다운샘플링)
    # 2x2 영역에서 최댓값만 남겨 크기를 절반으로 줄임 (28→14)
    layers.MaxPooling2D((2, 2), name='pool1'),

    # 3단계: 두 번째 컨볼루션
    # 더 복잡한 패턴(모서리 조합, 곡선 패턴 등)을 64개 필터로 감지
    layers.Conv2D(64, (5, 5), activation='relu', padding='same',
                  name='conv2'),

    # 4단계: 두 번째 풀링 (14→7)
    layers.MaxPooling2D((2, 2), name='pool2'),

    # === 분류부 (Classification) ===

    # 5단계: Flatten - 2D 특징 맵을 1D 벡터로 변환
    layers.Flatten(name='flatten'),

    # 6단계: 드롭아웃 - 과적합 방지 (학습 시 50% 뉴런 무작위 비활성화)
    layers.Dropout(0.5, name='dropout1'),

    # 7단계: 완전연결층 - 추출된 특징을 조합하여 판단
    # 💡 1024개의 뉴런으로 풍부한 표현력 확보 (손글씨 다양한 스타일 구분)
    layers.Dense(1024, activation='relu', name='dense1'),

    # 추가 드롭아웃
    layers.Dropout(0.5, name='dropout2'),

    # 8단계: 출력층 - 10개 숫자(0~9) 각각의 확률 계산
    layers.Dense(10, activation='softmax', name='output'),
])

# 모델 구조 확인
model.summary()

# %%
# ============================================================
# 📚 Cell 6: 모델 컴파일 및 학습
# ============================================================
# 모델에게 "어떻게 학습할지"를 알려주고, 실제 학습을 시작합니다.

# 컴파일: 학습 방법 설정
model.compile(
    optimizer='adam',                           # 최적화 알고리즘 (경사하강법의 발전된 버전)
    loss='sparse_categorical_crossentropy',     # 손실 함수 (다중 분류용)
    metrics=['accuracy']                        # 평가 지표 (정확도)
)

# 학습 시작!
# - epochs: 전체 데이터를 몇 번 반복 학습할지
# - batch_size: 한 번에 몇 장씩 학습할지
# - validation_split: 훈련 데이터의 20%를 검증용으로 분리
print("🚀 학습을 시작합니다!\n")

history = model.fit(
    x_train, y_train,
    epochs=10,
    batch_size=128,
    validation_split=0.2,
    verbose=1
)

print("\n✅ 학습 완료!")

# %%
# ============================================================
# 📈 Cell 7: 학습 과정 시각화
# ============================================================
# 에포크(반복)가 진행될수록 모델이 어떻게 발전하는지 그래프로 확인합니다.

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

# 정확도 그래프
ax1.plot(history.history['accuracy'], 'b-o', label='훈련 정확도', markersize=4)
ax1.plot(history.history['val_accuracy'], 'r-s', label='검증 정확도', markersize=4)
ax1.set_title('에포크별 정확도 변화', fontsize=13, fontweight='bold')
ax1.set_xlabel('에포크 (Epoch)')
ax1.set_ylabel('정확도 (Accuracy)')
ax1.legend(fontsize=11)
ax1.grid(True, alpha=0.3)
ax1.set_ylim([0.9, 1.0])

# 손실 그래프
ax2.plot(history.history['loss'], 'b-o', label='훈련 손실', markersize=4)
ax2.plot(history.history['val_loss'], 'r-s', label='검증 손실', markersize=4)
ax2.set_title('에포크별 손실(Loss) 변화', fontsize=13, fontweight='bold')
ax2.set_xlabel('에포크 (Epoch)')
ax2.set_ylabel('손실 (Loss)')
ax2.legend(fontsize=11)
ax2.grid(True, alpha=0.3)

plt.tight_layout()
plt.show()

# 관찰 포인트 출력
train_acc = history.history['accuracy'][-1]
val_acc = history.history['val_accuracy'][-1]
print(f"\n📊 최종 결과:")
print(f"   훈련 정확도: {train_acc*100:.2f}%")
print(f"   검증 정확도: {val_acc*100:.2f}%")
if train_acc - val_acc > 0.02:
    print(f"   ⚠️ 훈련-검증 정확도 차이: {(train_acc-val_acc)*100:.2f}% → 과적합 가능성 있음!")
else:
    print(f"   ✅ 훈련-검증 정확도가 비슷합니다 → 과적합 없음")

# %%
# ============================================================
# 🎯 Cell 8: 테스트 데이터로 최종 평가
# ============================================================
# 모델이 한 번도 본 적 없는 테스트 데이터로 진짜 실력을 평가합니다.

test_loss, test_accuracy = model.evaluate(x_test, y_test, verbose=0)
print(f"테스트 정확도: {test_accuracy*100:.2f}%")
print(f"테스트 손실: {test_loss:.4f}")
print(f"\n10,000장의 테스트 이미지 중 {int(test_accuracy * 10000)}장을 정확히 맞췄습니다!")

# %%
# ============================================================
# 🔍 Cell 9: 예측 결과 확인하기
# ============================================================
# 모델이 각 숫자를 어떻게 예측하는지 눈으로 확인해봅시다!
# 초록색 = 정답, 빨간색 = 오답

predictions = model.predict(x_test[:20], verbose=0)

fig, axes = plt.subplots(2, 10, figsize=(16, 4))
fig.suptitle('모델의 예측 결과', fontsize=14, fontweight='bold')

for i in range(20):
    ax = axes[i // 10][i % 10]
    ax.imshow(x_test[i].reshape(28, 28), cmap='gray')

    pred = np.argmax(predictions[i])
    conf = predictions[i][pred] * 100
    true = y_test[i]

    color = 'green' if pred == true else 'red'
    ax.set_title(f'{pred} ({conf:.0f}%)', fontsize=9, color=color, fontweight='bold')
    ax.axis('off')

plt.tight_layout()
plt.show()

# 틀린 예시 찾기
wrong_indices = np.where(np.argmax(model.predict(x_test, verbose=0), axis=1) != y_test)[0]
print(f"\n❌ 틀린 예시 수: {len(wrong_indices)}개 / 10,000개")

# %%
# ============================================================
# 🤔 Cell 10: AI가 틀린 예시 분석하기
# ============================================================
# AI도 실수를 합니다! 어떤 숫자를 헷갈려하는지 살펴봅시다.
# 사람이 봐도 헷갈리는 글씨가 많다는 걸 알 수 있어요!

if len(wrong_indices) > 0:
    fig, axes = plt.subplots(2, 5, figsize=(12, 5))
    fig.suptitle('AI가 틀린 숫자들 - 왜 헷갈렸을까?', fontsize=14, fontweight='bold')

    for i in range(min(10, len(wrong_indices))):
        ax = axes[i // 5][i % 5]
        idx = wrong_indices[i]
        ax.imshow(x_test[idx].reshape(28, 28), cmap='gray')

        pred = np.argmax(model.predict(x_test[idx:idx+1], verbose=0))
        true = y_test[idx]
        ax.set_title(f'정답: {true}, 예측: {pred}', fontsize=10, color='red', fontweight='bold')
        ax.axis('off')

    plt.tight_layout()
    plt.show()

# %%
# ============================================================
# 🔬 Cell 11 (보너스): CNN이 학습한 필터 시각화하기
# ============================================================
# CNN의 첫 번째 레이어가 학습한 필터(=특징 추출기)를 눈으로 확인합니다.
# 각 필터는 특정 방향의 선, 가장자리 등을 감지하는 역할을 합니다.

conv1_weights = model.get_layer('conv1').get_weights()[0]
print(f"첫 번째 컨볼루션 필터: {conv1_weights.shape}")
print(f"  → {conv1_weights.shape[3]}개의 5x5 필터")

fig, axes = plt.subplots(4, 8, figsize=(14, 7))
fig.suptitle('Conv1이 학습한 32개의 필터 (특징 추출기)', fontsize=14, fontweight='bold')

for i in range(32):
    ax = axes[i // 8][i % 8]
    ax.imshow(conv1_weights[:, :, 0, i], cmap='RdBu_r', vmin=-0.5, vmax=0.5)
    ax.set_title(f'필터 {i+1}', fontsize=8)
    ax.axis('off')

plt.tight_layout()
plt.show()
print("\n💡 각 필터는 특정 패턴(가로선, 세로선, 대각선, 곡선 등)을 감지합니다.")

# %%
# ============================================================
# 🧪 Cell 12 (보너스): 특징 맵 시각화 - CNN이 숫자를 어떻게 보는지
# ============================================================
# CNN의 각 레이어를 통과할 때 이미지가 어떻게 변환되는지 확인합니다.
# 레이어가 깊어질수록 더 추상적인 특징을 감지합니다!

# 중간 레이어 출력을 볼 수 있는 모델 생성
layer_outputs = [layer.output for layer in model.layers[:4]]  # Conv1, Pool1, Conv2, Pool2
feature_model = keras.Model(inputs=model.input, outputs=layer_outputs)

# 테스트 이미지 하나 선택
test_img = x_test[0:1]
features = feature_model.predict(test_img, verbose=0)

layer_names = ['Conv1 (특징 추출)', 'Pool1 (크기 축소)', 'Conv2 (패턴 감지)', 'Pool2 (크기 축소)']

fig, axes = plt.subplots(4, 9, figsize=(16, 8))
fig.suptitle(f'숫자 "{y_test[0]}"의 CNN 처리 과정', fontsize=14, fontweight='bold')

for layer_idx in range(4):
    feature_map = features[layer_idx][0]
    axes[layer_idx][0].set_ylabel(layer_names[layer_idx], fontsize=9, fontweight='bold')

    for fmap_idx in range(min(8, feature_map.shape[-1])):
        ax = axes[layer_idx][fmap_idx + 1]
        ax.imshow(feature_map[:, :, fmap_idx], cmap='viridis')
        if layer_idx == 0:
            ax.set_title(f'채널 {fmap_idx+1}', fontsize=8)
        ax.axis('off')

    # 원본 이미지 (첫 열)
    if layer_idx == 0:
        axes[layer_idx][0].imshow(test_img[0].reshape(28, 28), cmap='gray')
        axes[layer_idx][0].set_title('원본', fontsize=9, fontweight='bold')
    axes[layer_idx][0].axis('off')

plt.tight_layout()
plt.show()

print("💡 레이어가 깊어질수록 더 추상적인 특징을 감지합니다!")
print("   - Conv1: 가장자리, 선 등 기본 특징")
print("   - Conv2: 곡선, 모서리 조합 등 복잡한 패턴")

# %%
# ============================================================
# 🧪 Cell 13 (실험): 하이퍼파라미터 변경의 효과
# ============================================================
# 아래 값들을 바꿔보며 결과가 어떻게 달라지는지 관찰해보세요!
# 질문: "필터 수를 줄이면?", "에포크를 늘리면?", "드롭아웃을 높이면?"

EXPERIMENT_FILTERS_1 = 32     # 첫 번째 Conv 필터 수 (시도: 8, 16, 32, 64)
EXPERIMENT_FILTERS_2 = 64     # 두 번째 Conv 필터 수 (시도: 16, 32, 64, 128)
EXPERIMENT_DENSE_UNITS = 128  # Dense 레이어 뉴런 수 (시도: 32, 64, 128, 256)
EXPERIMENT_EPOCHS = 10        # 학습 반복 횟수 (시도: 1, 3, 5, 10, 20)
EXPERIMENT_DROPOUT = 0.25     # 드롭아웃 비율 (시도: 0.0, 0.25, 0.5)

# 실험용 모델 생성
exp_model = keras.Sequential([
    layers.Conv2D(EXPERIMENT_FILTERS_1, (3, 3), activation='relu', input_shape=(28, 28, 1)),
    layers.MaxPooling2D((2, 2)),
    layers.Conv2D(EXPERIMENT_FILTERS_2, (3, 3), activation='relu'),
    layers.MaxPooling2D((2, 2)),
    layers.Flatten(),
    layers.Dropout(EXPERIMENT_DROPOUT),
    layers.Dense(EXPERIMENT_DENSE_UNITS, activation='relu'),
    layers.Dense(10, activation='softmax'),
])

exp_model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

print(f"🔬 실험 설정:")
print(f"   필터: {EXPERIMENT_FILTERS_1} → {EXPERIMENT_FILTERS_2}")
print(f"   Dense: {EXPERIMENT_DENSE_UNITS}, Dropout: {EXPERIMENT_DROPOUT}")
print(f"   Epochs: {EXPERIMENT_EPOCHS}")
print(f"   총 파라미터: {exp_model.count_params():,}개\n")

exp_history = exp_model.fit(x_train, y_train, epochs=EXPERIMENT_EPOCHS,
                            batch_size=128, validation_split=0.2, verbose=1)

exp_loss, exp_acc = exp_model.evaluate(x_test, y_test, verbose=0)
print(f"\n📊 실험 결과: 테스트 정확도 {exp_acc*100:.2f}%")
